//
//  AlicomFusionMananer.m
//  AlicomFusionAuthDemo
//
//  Created by yanke on 2023/2/13.
//

#import "AlicomFusionManager.h"
#import "AlicomFusionAuth/AlicomFusionAuth.h"
#import "AlicomFusionAuthTokenManager.h"
#import "AlicomFusionNetAdapter.h"
#import "IAPInterface.h"
#import "DeviceUtil.h"
#import "ToastView.h"


@interface AlicomFusionManager ()
@property (nonatomic, copy) NSString *currTemplateId;
@property (nonatomic, weak) UIViewController *currVC;
@property (nonatomic, assign) NSInteger reGetTime;
@property (nonatomic, strong) AlicomFusionNumberAuthModel *authmodel;
@property (nonatomic, strong) AlicomFusionVerifyCodeView *verifyView;
@property (nonatomic, strong) AlicomFusionUpGoingView *upGoingView;
@property (nonatomic, copy) NSString *smsContent;
@property (nonatomic, copy) NSString *receiveNum;
@end

@implementation AlicomFusionManager

BOOL isCheck = NO;


+ (instancetype)shareInstance {
    static AlicomFusionManager *instance = nil ;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        if (instance == nil) {
            [AlicomFusionLog logEnable:YES];
            instance = [[AlicomFusionManager alloc] init];
            instance.reGetTime = 3;
        }
    });
    return instance;
}

- (void)destory {
    [self.handler destroy];
    self.handler = nil;
    self.isActive = NO;
    [AlicomFusionAuthTokenManager shareInstance].authTokenStr = nil;
}

- (void)start{
    
    [AlicomFusionAuthTokenManager getAuthToken:^(NSString * _Nonnull tokenStr,NSString *errorMsg) {
        if (errorMsg){
            dispatch_async(dispatch_get_main_queue(), ^{
                NSLog(@"%@",errorMsg);
            });
        } else {
            [self initFusionAuth];
        }
    }];
}

- (void)startSceneWithTemplateId:(NSString *)templateId viewController:(UIViewController *)controller{
    self.currTemplateId = templateId;
    self.currVC = controller;
    [self.handler startSceneUIWithTemplateId:self.currTemplateId viewController:controller delegate:self];
}

- (void)stopScene{
    [self.handler stopSceneWithTemplateId:self.currTemplateId];
}

- (void)initFusionAuth{
    if (!self.handler){
       NSString *tokenStr = [AlicomFusionAuthTokenManager shareInstance].authTokenStr;
        
        AlicomFusionAuthToken *token = [[AlicomFusionAuthToken alloc] initWithTokenStr:tokenStr];
        self.handler = [[AlicomFusionAuthHandler alloc] initWithToken:token schemeCode:DEMO_SCHEME_CODE];
        [self.handler setFusionAuthDelegate:self];
    }
}

- (void)dealWithPhone:(NSString *)phoneNum {
    
    
//    if (phoneNum.length < 11) {
//        [AlicomFusionToastTool showToastMsg:@"获取手机号失败" time:2];
//        return;
//    }
    if ([AlicomFusionTemplateId_100001 isEqualToString:self.currTemplateId]) {
        NSUserDefaults *ud = [NSUserDefaults standardUserDefaults];
        [ud setObject:phoneNum forKey:kDEMO_UD_PHONE_NUM];
        [ud synchronize];
//        [AlicomFusionToastTool showToastMsg:@"登录成功" time:2];
        [self.handler stopSceneWithTemplateId:self.currTemplateId];
    } else if ([AlicomFusionTemplateId_100002 isEqualToString:self.currTemplateId]) {
        NSUserDefaults *ud = [NSUserDefaults standardUserDefaults];
        [ud setObject:phoneNum forKey:kDEMO_UD_PHONE_NUM];
        [ud synchronize];
//        [AlicomFusionToastTool showToastMsg:@"修改手机号成功" time:2];
        [self.handler stopSceneWithTemplateId:self.currTemplateId];
    } else if ([AlicomFusionTemplateId_100003 isEqualToString:self.currTemplateId]) {
        NSUserDefaults *ud = [NSUserDefaults standardUserDefaults];
        NSString *loginPhone = [ud objectForKey:kDEMO_UD_PHONE_NUM];
        if ([phoneNum isEqualToString:loginPhone]) {
//            [AlicomFusionToastTool showToastMsg:@"手机号验证通过,可以去修改密码了" time:2];
            [self.handler stopSceneWithTemplateId:self.currTemplateId];
            dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.5 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
                if ([self.delegate respondsToSelector:@selector(verifySuccess)]){
                    [self.delegate verifySuccess];
                }
            });
            
      
        } else {
//            [AlicomFusionToastTool showToastMsg:@"手机号验证不通过" time:2];
            [self.handler continueSceneWithTemplateId:self.currTemplateId isSuccess:NO];
        }
    } else if ([AlicomFusionTemplateId_100004 isEqualToString:self.currTemplateId]) {
        NSUserDefaults *ud = [NSUserDefaults standardUserDefaults];
        [ud setObject:phoneNum forKey:kDEMO_UD_PHONE_NUM];
        [ud synchronize];
//        [AlicomFusionToastTool showToastMsg:@"新手机号绑定成功" time:2];
        [self.handler stopSceneWithTemplateId:self.currTemplateId];
    } else if ([AlicomFusionTemplateId_100005 isEqualToString:self.currTemplateId]) {
        NSUserDefaults *ud = [NSUserDefaults standardUserDefaults];
        NSString *loginPhone = [ud objectForKey:kDEMO_UD_PHONE_NUM];
        if ([phoneNum isEqualToString:loginPhone]) {
//            [AlicomFusionToastTool showToastMsg:@"手机号验证通过" time:2];
            [self.handler stopSceneWithTemplateId:self.currTemplateId];
        } else {
//            [AlicomFusionToastTool showToastMsg:@"手机号验证不通过" time:2];
            [self.handler continueSceneWithTemplateId:self.currTemplateId isSuccess:NO];
        }
    }

    
}

#pragma mark - AlicomFusionAuthDelegate
/**
 *  token需要更新
 *  @note 必选回调，handler 初始化&历史token过期前5分钟，会触发此回调，由SDK维护token的生命周期
 *  @param handler handler
 *  @return token，APP更新最新token后，组装AlicomFusionAuthToken返回给到SDK，SDK会通过此token进行鉴权更新
 */
- (AlicomFusionAuthToken *)onSDKTokenUpdate:(AlicomFusionAuthHandler *)handler {
    NSLog(@"%s，调用",__func__);
 
    NSString *tokenStr = [AlicomFusionAuthTokenManager updateAuthToken];
    AlicomFusionAuthToken *token = [[AlicomFusionAuthToken alloc] initWithTokenStr:tokenStr];
 
    return token;
}

/**
 *  token鉴权成功
 *  @note 必选回调，token鉴权成功后，才可以调用startScene接口拉起场景
 *  @param handler handler
 */
- (void)onSDKTokenAuthSuccess:(AlicomFusionAuthHandler *)handler {
    NSLog(@"%s，调用",__func__);
    self.isActive = YES;
    self.reGetTime = 3;

//    if ([AlicomFusionManager shareInstance].isActive){
    
    if(self.isGuest == YES){
        NSLog(@"startScene---绑定账号");
        [[AlicomFusionManager shareInstance] startSceneWithTemplateId:BIND_ACCOUNT viewController:[self theTopviewControler]];
    }else{
        NSLog(@"startScene---正常进入账号");
        [[AlicomFusionManager shareInstance] startSceneWithTemplateId:LOGIN_TEMPLATEID viewController:[self theTopviewControler]];
    }
//    }else{
//        [[AlicomFusionManager shareInstance] start];
////            [AlicomFusionToastTool showToastMsg:@"token鉴权未完成" time:2];
//    }
}
//需要获取到显示在最上面的viewController
- (UIViewController *)theTopviewControler{
    //获取根控制器
    UIViewController *rootVC = [[UIApplication sharedApplication].delegate window].rootViewController;
    
    UIViewController *parentC = rootVC;
    //遍历 如果是presentViewController
    while ((parentC = rootVC.presentedViewController) != nil ) {
        rootVC = parentC;
    }

    while ([rootVC isKindOfClass:[UINavigationController class]]) {
        rootVC = [(UINavigationController *)rootVC topViewController];
    }
    return rootVC;
}
- (UIView *)theTopView {
    
    // 获取根控制器
    UIViewController *rootVC = [[UIApplication sharedApplication].delegate window].rootViewController;

    UIViewController *parentC = rootVC;
    // 遍历 如果是presentViewController
    while ((parentC = rootVC.presentedViewController) != nil) {
        rootVC = parentC;
    }

    // 如果是UINavigationController，获取topViewController
    while ([rootVC isKindOfClass:[UINavigationController class]]) {
        rootVC = [(UINavigationController *)rootVC topViewController];
    }

    // 获取顶层控制器的视图
    return rootVC.view;
}

/**
 *  token鉴权失败
 *  @note 必选回调，token初次鉴权失败&token更新后鉴权失败均会触发此回调
 *  @note token鉴权失败后，无法继续使用SDK的功能，请销毁SDK后重新初始化
 *  @param handler handler
 *  @param failToken 错误token
 *  @param error 错误定义
 */
- (void)onSDKTokenAuthFailure:(AlicomFusionAuthHandler *)handler
                    failToken:(AlicomFusionAuthToken *)failToken
                        error:(AlicomFusionEvent *)error {
    NSLog(@"%s，调用:{\n%@}",__func__,error.description);
    
    self.isActive = NO;
    if (self.reGetTime > 0) {
        NSString *tokenStr = [AlicomFusionAuthTokenManager updateAuthToken];
        AlicomFusionAuthToken *token = [[AlicomFusionAuthToken alloc] initWithTokenStr:tokenStr];
        [handler updateToken:token];
        self.reGetTime --;
    } else {
        self.reGetTime = 3;
        [self.handler destroy];
        self.handler = nil;
        [AlicomFusionAuthTokenManager shareInstance].authTokenStr = nil;
        return;
    }
}

/**
 *  认证成功
 *  @note 必选回调
 *  @note 可以使用码号效验maskToken去APP Server做最终验证换取真实手机号码，如果换取手机号失败，可以通过SDK的continue接口继续后续场景流程
 *  @param handler handler
 *  @param maskToken 码号效验token
 */
- (void)onVerifySuccess:(AlicomFusionAuthHandler *)handler
               nodeName:(nonnull NSString *)nodeName
              maskToken:(NSString *)maskToken
                  event:(nonnull AlicomFusionEvent *)event {
    
    
    if(self.isGuest == YES){
//        self.isGuest = NO;
        [[IAPInterface sharedSingleton] setGuestToken:maskToken];//游客模式 绑定账号回调到js保存token
    }else{
        [[IAPInterface sharedSingleton] test1:maskToken withString:[DeviceUtil getUUIDByKeyChain]];
    }
    
    
    //关闭窗口试试
//    [self dealWithPhone:@""];
    // 2. 正常访问模式
    // 换手机号
//    dispatch_async(dispatch_get_main_queue(), ^{
// 
//    });
//    [AlicomFusionNetAdapter verifyTokenRequest:maskToken complete:^(id data,NSError *error) {
//        dispatch_async(dispatch_get_main_queue(), ^{
//             if (data&&!error){
//                //保存手机号
//                if ([data isKindOfClass:NSDictionary.class]) {
//                    NSString *verifyResult = ((NSDictionary *)data)[@"VerifyResult"];
//                    if ([@"PASS" isEqualToString:verifyResult]) {
//                        [self dealWithPhone:((NSDictionary *)data)[@"PhoneNumber"]];
//                    } else if ([@"REJECT" isEqualToString:verifyResult] || [@"UNKNOW" isEqualToString:verifyResult]) {
//                        
//                        if ([nodeName isEqualToString:AlicomFusionNodeNameNumberAuth]) {
//                            NSLog(@"一键登录失败");
//                        } else if ([nodeName isEqualToString:AlicomFusionNodeNameVerifyCodeAuth]) {
//                             NSLog(@"获取手机号失败，请检查验证码是否正确或是否过期");
//                        } else if ([nodeName isEqualToString:AlicomFusionNodeNameUpGoingAuth]) {
//                             NSLog(@"获取手机号失败，请检查短信是否发送成功");
//                        }
//                        
//                        if (![AlicomFusionNodeNameVerifyCodeAuth isEqualToString:nodeName]) {
//                            [self.handler continueSceneWithTemplateId:self.currTemplateId isSuccess:NO];
//                        }
//                    }
//                } else {
//                    if (![AlicomFusionNodeNameVerifyCodeAuth isEqualToString:nodeName]) {
//                        [self.handler continueSceneWithTemplateId:self.currTemplateId isSuccess:NO];
//                    }
//                }
//            }else{
//                //结束认证
//                [self.handler stopSceneWithTemplateId:self.currTemplateId];
//                NSLog(@"获取手机号失败，请检查短信是否发送成功");
//
//             }
//        });
//    }];
}

- (void)onHalfwayVerifySuccess:(AlicomFusionAuthHandler *)handler nodeName:(NSString *)nodeName maskToken:(NSString *)maskToken event:(nonnull AlicomFusionEvent *)event resultBlock:(void (^)(BOOL))resultBlock {
    
    NSLog(@"%s，调3333用.nodeName=%@",__func__,nodeName);
    // 2. 正常访问模式
    dispatch_async(dispatch_get_main_queue(), ^{
     });
    [AlicomFusionNetAdapter verifyTokenRequest:maskToken complete:^(id data,NSError *error) {
        dispatch_async(dispatch_get_main_queue(), ^{
             if (data&&!error){
                //保存手机号
                if ([data isKindOfClass:NSDictionary.class]) {
                    NSString *verifyResult = ((NSDictionary *)data)[@"VerifyResult"];
                    if ([@"PASS" isEqualToString:verifyResult]) {
                        NSLog(@"校验成功");
                         if (resultBlock) {
                            resultBlock(YES);
                        }
                    } else if ([@"REJECT" isEqualToString:verifyResult] || [@"UNKNOW" isEqualToString:verifyResult]) {
                         NSLog(@"校验失败");
                    }
                } else {
                    NSLog(@"校验失败");
                }
            }else{
                NSLog(@"校验失败");
            }
        });
    }];
}

- (void)onVerifyFailed:(AlicomFusionAuthHandler *)handler nodeName:(nonnull NSString *)nodeName error:(nonnull AlicomFusionEvent *)error {
    NSLog(@"%s，nodeName=%@,调1112用:{\n%@}",__func__,nodeName,error.description);
    if ([nodeName isEqualToString:AlicomFusionNodeNameVerifyCodeAuth]) {
        if ([error.resultCode isEqualToString:AlicomFusionVerifyCodeFrequency] || [error.resultCode isEqualToString:AlicomFusionVerifyCodeRisk]) {
            dispatch_async(dispatch_get_main_queue(), ^{
//                [AlicomFusionToastTool showToastMsg:error.resultMsg time:2];
            });
            [self.handler continueSceneWithTemplateId:self.currTemplateId isSuccess:NO];
        } else if ([AlicomFusionVerifyCodeAutoNumberShowFail isEqualToString:error.resultCode]) {
            dispatch_async(dispatch_get_main_queue(), ^{
//                [AlicomFusionToastTool showToastMsg:error.resultMsg time:2];
            });
            [self.handler stopSceneWithTemplateId:self.currTemplateId];
        } else {
            dispatch_async(dispatch_get_main_queue(), ^{
//                [AlicomFusionToastTool showToastMsg:error.resultMsg time:2];
            });
        }
    } else {
        [self.handler continueSceneWithTemplateId:self.currTemplateId isSuccess:NO];
    }
}

/**
 *  认证结束
 *  @note 必选回调，SDK认证流程结束
 *  @param handler handler
 *  @param event 结束事件
 */
- (void)onTemplateFinish:(AlicomFusionAuthHandler *)handler event:(AlicomFusionEvent *)event {
//    NSLog(@"%s，调用:{\n%@}",__func__,event.description);
    //结束认证
    [self.handler stopSceneWithTemplateId:self.currTemplateId];
}

- (void)onProtocolClick:(AlicomFusionAuthHandler *)handler protocolName:(NSString *)protocolName protocolUrl:(NSString *)protocolUrl event:(AlicomFusionEvent *)event
{
//    NSLog(@"%s，调用:{\n%@}",__func__,event.description);
    NSLog(@"协议名称：%@，协议URL：%@", protocolName, protocolUrl);
    NSURL *url = [NSURL URLWithString:protocolUrl];
    if (@available(iOS 10, *)) {
        // iOS 10 及以上版本
        [[UIApplication sharedApplication] openURL:url options:@{} completionHandler:nil];
    } else {
        // iOS 9 及以下版本
        [[UIApplication sharedApplication] openURL:url];
    }
 
}

- (void)onVerifyInterrupt:(AlicomFusionAuthHandler *)handler event:(AlicomFusionEvent *)event {
    if ([event.resultCode isEqualToString:AlicomFusionStartLoading]) {
//        [AlicomFusionToastTool showLoading];
    } else if ([event.resultCode isEqualToString:AlicomFusionEndLoading]) {
//        [AlicomFusionToastTool hideLoading];
    } else {
//        [AlicomFusionToastTool showToastMsg:[NSString stringWithFormat:@"%@,%@", event.resultCode, event.resultMsg] time:2];
        [ToastView showToastMsg:event.resultMsg inView:[self theTopView]];
    }
}

/**
 *  场景事件回调
 *  @note 可选回调，SDK场景流程中流程中各个界面点击事件&界面跳转事件等UI相关回调
 *  @note 本回调接口仅做事件通知，不可再此回调内处理业务逻辑
 *  @param handler handler
 *  @param event 点击事件，具体定义参考AlicomFusionEvent.h
 */
- (void)onAuthEvent:(AlicomFusionAuthHandler *)handler
          eventData:(AlicomFusionEvent *)event {
//    NSLog(@"%s，调用:{\n%@}",__func__,event.description);
    NSString *description = nil;
    if(event.extendData[@"isCheckBoxSelected"]){
        description = event.extendData[@"isCheckBoxSelected"];
        isCheck = description;
    }
}

/**
 *  填充手机号，用于校验手机号是否和输入的一致，或者重新绑定手机号场景自动填充手机号
 *  @note 必选回调，SDK内置UI部分手机号
 *  @note 比如重置密码场景，需要先填写原手机号码进行第一步效验，SDK需效验该填写值是否为真实的原手机号码，或者重新绑定手机号场景自动填充手机号
 *  @param handler handler
 *  @param event 事件
 *  @return 返回当前用户正在使用的手机号用于下一步操作
 */
- (NSString *)onGetPhoneNumberForVerification:(AlicomFusionAuthHandler *)handler
                                        event:(nonnull AlicomFusionEvent *)event {
    NSUserDefaults *ud = [NSUserDefaults standardUserDefaults];
    NSString *phoneNum = [ud objectForKey:kDEMO_UD_PHONE_NUM];
    return phoneNum;
    
}


- (void)otherPhoneLoginClick {
    [self.authmodel otherPhoneLogin];
//    [self.handler stopSceneWithTemplateId:self.currTemplateId];
//    [[AlicomFusionManager shareInstance] startSceneWithTemplateId:AlicomFusionTemplateId_100001 viewController:[self theTopviewControler]];
    
    
    
}

#pragma mark - AlicomFusionAuthUIDelegate
- (void)onPhoneNumberVerifyUICustomDefined:(AlicomFusionAuthHandler *)handler
                                templateId:(nonnull NSString *)templateId
                                    nodeId:(NSString *)nodeId
                                   UIModel:(AlicomFusionNumberAuthModel *)model {
   
    ///
    self.authmodel = model;
    //隐藏更多登录方式按钮
    model.changeBtnIsHidden = NO;
    
    model.changeBtnFrameBlock = ^CGRect(CGSize screenSize, CGSize superViewSize, CGRect frame) {
        // 动态调整x、y、width、height
//        frame.origin.x = 20; // 距离父视图左侧20pt
        frame.origin.y = 450; // 距离父视图顶部300pt
//        frame.size.width = 200; // 按钮宽度为200pt
//        frame.size.height = 40; // 按钮高度为40pt
        return frame;
    };
    model.changeBtnTitle = [[NSAttributedString alloc] initWithString:@"游客登录"
                                                           attributes:@{
                                                               NSFontAttributeName: [UIFont systemFontOfSize:18],
                                                               NSForegroundColorAttributeName: [UIColor grayColor]
                                                           }];
    model.supportedInterfaceOrientations = UIInterfaceOrientationMaskPortrait;
    model.presentDirection = AlicomFusionPresentationDirectionBottom;
    model.navTitle = [[NSAttributedString alloc] initWithString:@"一键登录"];
    model.navColor = AlicomColorHex(0xEFF3F2);
    model.logoIsHidden = YES;
    model.numberColor = AlicomColorHex(0x262626);
    model.numberFont = [UIFont systemFontOfSize:24];
    NSDictionary *loginAttriDict = @{
        NSFontAttributeName: [UIFont systemFontOfSize:16],
        NSForegroundColorAttributeName: AlicomColorHex(0xFFFFFF)
    };
    NSMutableAttributedString *loginAttr = [[NSMutableAttributedString alloc] initWithString:@"一键登录" attributes:loginAttriDict];
    model.loginBtnText = loginAttr;
//    UIImage *unSelectImage = [AlicomFusionDemoUtil demoImageWithColor:AlicomColorHex(0x0064C8) size:CGSizeMake(ALICOM_FUSION_DEMO_SCREEN_WIDTH - 32, 44) isRoundedCorner:NO radius:0.0];
//    UIImage *selectImage = [AlicomFusionDemoUtil demoImageWithColor:AlicomColorHex(0x0064C8) size:CGSizeMake(ALICOM_FUSION_DEMO_SCREEN_WIDTH - 32, 44) isRoundedCorner:NO radius:0.0];
//    UIImage *heighLightImage = [AlicomFusionDemoUtil demoImageWithColor:AlicomColorHex(0x0064C8) size:CGSizeMake(ALICOM_FUSION_DEMO_SCREEN_WIDTH - 32, 44) isRoundedCorner:NO radius:0.0];
//    model.loginBtnBgImgs = @[unSelectImage, selectImage, heighLightImage];
    
    NSDictionary *sloganAttriDict = @{
        NSFontAttributeName: [UIFont systemFontOfSize:15],
        NSForegroundColorAttributeName: AlicomColorHex(0x555555)
    };
    NSMutableAttributedString *sloganAttr = [[NSMutableAttributedString alloc] initWithString:@"阿里云为您提供认证服务" attributes:sloganAttriDict];
    model.sloganText = sloganAttr;
    model.privacyOperatorIndex = 2;
    model.privacyOne = @[@"用户协议",@"https://hallcq.jpsdk.com/static/privacy/game/jueduifangyu2/userServiceAgreement.html"];
    model.privacyTwo = @[@"隐私政策",@"https://hallcq.jpsdk.com/static/privacy/game/jueduifangyu2/privacyPolicy.html"];
    
    model.privacyConectTexts = @[@"、",@" 和 "];
    model.privacyPreText = @"我已阅读并同意 ";
    model.privacyOperatorPreText = @"";
    model.privacyOperatorSufText = @"";
    model.privacyColors = @[AlicomColorHex(0x262626), AlicomColorHex(0x262626)];
    model.privacyFont = [UIFont systemFontOfSize:14];
    model.checkBoxIsHidden = NO;
    model.checkBoxIsChecked = NO;
    model.checkBoxWH = 21;
    model.backgroundColor = AlicomColorHex(0xEFF3F2);
    model.moreLoginActionBlock = ^{
        NSLog(@"其他登录方式");
        if(isCheck == YES){
            self.isGuest = YES;
            NSLog(@"勾选了协议 %@", self.currTemplateId);
            //进入游戏 传3
            [[IAPInterface sharedSingleton] test1:@"3" withString:[DeviceUtil getUUIDByKeyChain]];
            [self destory];
            
        }else{
            NSLog(@"没有勾选");
            [ToastView showToastMsg:@"请勾选协议信息！" inView:[self theTopView]];
        }
    };
    
    UIButton *otherLogin = [UIButton buttonWithType:UIButtonTypeCustom];
    [otherLogin setTitle:@"其他手机号登录" forState:UIControlStateNormal];
    otherLogin.backgroundColor = UIColor.whiteColor;
    [otherLogin setTitleColor:AlicomColorHex(0x262626) forState:UIControlStateNormal];
    otherLogin.titleLabel.font = [UIFont systemFontOfSize:16];
    [otherLogin addTarget:self action:@selector(otherPhoneLoginClick) forControlEvents:UIControlEventTouchUpInside];
    model.otherLoginButton = otherLogin;
       
    model.numberFrameBlock = ^CGRect(CGSize screenSize, CGSize superViewSize, CGRect frame) {
        CGFloat x = (screenSize.width - frame.size.width) * 0.5;
        CGFloat y = screenSize.width>screenSize.height?30:214;
        CGRect rect = CGRectMake(x, y, frame.size.width, frame.size.height);
        return rect;
    };
    
    model.sloganFrameBlock = ^CGRect(CGSize screenSize, CGSize superViewSize, CGRect frame) {
        CGFloat y = screenSize.width>screenSize.height?70:252;
        CGRect rect = CGRectMake(frame.origin.x, y, frame.size.width, frame.size.height);
        return rect;
    };
    
    model.loginBtnFrameBlock = ^CGRect(CGSize screenSize, CGSize superViewSize, CGRect frame) {
        CGFloat y = screenSize.width>screenSize.height?104:318;
        CGRect rect = CGRectMake(frame.origin.x, y, frame.size.width, frame.size.height);
        return rect;
    };
    
    model.nameLabelFrameBlock = ^CGRect(CGSize screenSize, CGSize superViewSize, CGRect frame) {
        return frame;
    };
    model.otherLoginButtonFrameBlock = ^CGRect(CGSize screenSize, CGSize superViewSize, CGRect frame) {
        return frame;
    };
    
//    model.privacyFrameBlock = ^CGRect(CGSize screenSize, CGSize superViewSize, CGRect frame) {
//        CGRect rect = CGRectMake(frame.origin.x, screenSize.height - 60 - ALICOM_FUSION_DEMO_STATUS_BAR_HEIGHT - frame.size.height - 34, frame.size.width, frame.size.height);
//        return rect;
//    };
    
//    model.customViewLayoutBlock = ^(CGSize screenSize, CGRect contentViewFrame, CGRect nameLabelFrame, CGRect otherLoginBtnFrame, CGRect navFrame, CGRect titleBarFrame, CGRect logoFrame, CGRect sloganFrame, CGRect numberFrame, CGRect loginFrame, CGRect changeBtnFrame, CGRect privacyFrame) {
//        
//    };

    model.customViewBlock = ^(UIView * _Nonnull superCustomView) {};
    
    
    
    model.privacyAlertIsNeedShow = YES;
    model.privacyAlertIsNeedAutoLogin = YES;
    model.privacyAlertCornerRadiusArray = @[@4, @4, @4, @4];
    model.privacyAlertTitleFont = [UIFont systemFontOfSize:16];
    model.privacyAlertTitleColor = AlicomColorHex(0x262626);
    model.privacyAlertContentFont = [UIFont systemFontOfSize:16];
    model.privacyAlertContentAlignment = NSTextAlignmentCenter;
    model.privacyAlertButtonTextColors = @[AlicomColorHex(0x0064C8), AlicomColorHex(0x0064C8)];
//    UIImage *imageUnselect = [AlicomFusionDemoUtil demoImageWithColor:AlicomColorHex(0xFFFFFF) size:CGSizeMake(ALICOM_FUSION_DEMO_SCREEN_WIDTH, 56) isRoundedCorner:NO radius:0.0];
//    UIImage *imageSelect = [AlicomFusionDemoUtil demoImageWithColor:AlicomColorHex(0xFFFFFF) size:CGSizeMake(ALICOM_FUSION_DEMO_SCREEN_WIDTH, 56) isRoundedCorner:NO radius:0.0];
//    model.privacyAlertBtnBackgroundImages = @[imageUnselect, imageSelect];
    model.privacyAlertButtonFont = [UIFont systemFontOfSize:16];
    model.tapPrivacyAlertMaskCloseAlert = NO;
    model.privacyAlertMaskColor = AlicomColorHex(0x262626);
    model.privacyAlertMaskAlpha = 0.88;
    
    model.privacyAlertFrameBlock = ^CGRect(CGSize screenSize, CGSize superViewSize, CGRect frame) {
        CGRect rect = CGRectMake(27, (superViewSize.height - 200)*0.382, superViewSize.width - 54, 200);
        return rect;
    };
    
    model.privacyAlertTitleFrameBlock = ^CGRect(CGSize screenSize, CGSize superViewSize, CGRect frame) {
        CGRect rect = CGRectMake(0, 32, frame.size.width, frame.size.height);
        return rect;
    };
    
    model.privacyAlertPrivacyContentFrameBlock = ^CGRect(CGSize screenSize, CGSize superViewSize, CGRect frame) {
        CGRect rect = CGRectMake(24, 70, superViewSize.width - 48, frame.size.height);
        return rect;
    };
    
    model.privacyAlertButtonFrameBlock = ^CGRect(CGSize screenSize, CGSize superViewSize, CGRect frame) {
        CGRect rect = CGRectMake(0, superViewSize.height - 56, superViewSize.width, 56);
        return rect;
    };
}

- (void)onSMSCodeVerifyUICustomDefined:(AlicomFusionAuthHandler *)handler
                            templateId:(nonnull NSString *)templateId
                                nodeId:(NSString *)nodeId
                           isAutoInput:(BOOL)isAutoInput
                                  view:(AlicomFusionVerifyCodeView *)view {
    self.verifyView = view;
}


- (void)onSMSSendVerifyUICustomDefined:(AlicomFusionAuthHandler *)handler
                            templateId:(nonnull NSString *)templateId
                                nodeId:(NSString *)nodeId
                            smsContent:(nonnull NSString *)smsContent
                            receiveNum:(nonnull NSString *)receiveNum
                                  view:(AlicomFusionUpGoingView *)view {
    self.upGoingView = view;
    self.smsContent = smsContent;
    self.receiveNum = receiveNum;
    NSLog(@"smsContent-====%@,receiveNum=-------%@",smsContent,receiveNum);
}






- (void)onNavigationControllerCustomDefined:(AlicomFusionAuthHandler *)handler
                                 templateId:(nonnull NSString *)templateId
                                     nodeId:(NSString *)nodeId
                                 navigation:(UINavigationController *)naviController {
    
}

//



@end
