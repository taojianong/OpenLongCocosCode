#import "DeviceUtil.h"
#import "LQAppleLogin.h"
#import "IAPInterface.h"
#import "AppController.h"
#import <AuthenticationServices/AuthenticationServices.h>
#import <UIKit/UIKit.h>
#import <AdSupport/AdSupport.h>
#import <AudioToolbox/AudioToolbox.h>
#import "LoginViewController.h"
#import "IAPManager.h"
#import "RewardVideoAd.h"
#import "AlicomFusionManager.h"
#import <QYSDK/QYSDK.h>
#include <sys/utsname.h>

//@interface DeviceUtil ()<ATAdLoadingDelegate>     // 遵循协议
//@end
//@interface DeviceUtil ()<ATRewardedVideoDelegate>     // 遵循协议
//@end

@implementation DeviceUtil

BOOL isSave = YES;

+ (void)clearAllCaches:(NSString *)p {
    // 清除NSURLCache中的所有缓存
    //还要清除sdk
    [[AlicomFusionManager shareInstance] destory];
    [[NSURLCache sharedURLCache] removeAllCachedResponses];
}

+(NSString *)platform:(NSString *)p
{
    //[super viewDidLoad];
//    m_instance = self;
    if(isSave == YES){
        isSave = NO;
        [[IAPInterface sharedSingleton] savedDeviceId:[DeviceUtil getUUIDByKeyChain]];
    }
    
    return @"ChinaIos";
//    self.isShowAd = NO;s
}
-(void)initAd
{
    //[super viewDidLoad];
//    m_instance = self;
    NSLog(@"---viewDidLoad  ");
    
//    self.isShowAd = NO;
}

// 加载激励视频广告
  + (void)loadAd {
    // 设置extra，自定义参数，会在代理的Extra回传，可以用于该广告位的自定义规则匹配；开启服务器激励视频回调时，通过设置该值，然后在激励下发的时候回传给开发者。
      NSLog(@"-----load video----: ");
      return;
//    NSDictionary *extra = @{
//          kATAdLoadingExtraMediaExtraKey:@"media_val",
//          kATAdLoadingExtraUserIDKey:@"rv_test_user_id",
//          kATAdLoadingExtraRewardNameKey:@"reward_Name",
//          kATAdLoadingExtraRewardAmountKey:@(3)
//      };
//    // 加载激励视频广告
//    [[ATAdManager sharedManager] loadADWithPlacementID:@"b661c9ab894d46" extra:extra delegate:self];
//      DeviceUtil *testDele = [[DeviceUtil alloc] init];
//      [ATAdManager sharedManager].extra = @{kATAdLoadingExtraUserIDKey:@"test_user_id"};
//      [[ATAdManager sharedManager] loadADWithPlacementID:@"b661c9ab894d46" extra:@{kATAdLoadingExtraMediaExtraKey:@"media_val", kATAdLoadingExtraUserIDKey:@"rv_test_user_id"} delegate:self];
}
//需要获取到显示在最上面的viewController
+ (UIViewController *)theTopviewControler{
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
+ (void)showRewardVideoAd :(NSString *)p{
//     到达场景
    RewardVideoAd *reward = [[RewardVideoAd alloc]init];
        [reward ShowRewardVideoAdEx];
}

+ (void)initAlicomSDK:(NSString *)p{
    [[AlicomFusionManager shareInstance] start];
}


//-------------------------------------------------
+ (void)showUI:(NSString *)p{
//    NSString *strToken = [[NSUserDefaults standardUserDefaults] stringForKey:@"strToken"];
//    NSUUID *identifierForVendor = [[UIDevice currentDevice] identifierForVendor];
    NSLog(@"--- 打开输入手机号界面 ");
    [[IAPInterface sharedSingleton] savedDeviceId:[DeviceUtil getUUIDByKeyChain]];
    if([p isEqualToString:@"2"]){
        [AlicomFusionManager shareInstance].isGuest = NO;
    }else{
        [AlicomFusionManager shareInstance].isGuest = YES;
    }
    //还要清除sdk
    [[AlicomFusionManager shareInstance] destory];
    [[AlicomFusionManager shareInstance] start];
    
    //为了方便绑定账号不主动调起了
//    if ([AlicomFusionManager shareInstance].isActive){
//        NSLog(@"--- 打开sdk界面 %@ ",[DeviceUtil getUUIDByKeyChain]);
//        [[AlicomFusionManager shareInstance] startSceneWithTemplateId:LOGIN_TEMPLATEID viewController:[self theTopviewControler]];
//    }else{
//        NSLog(@"--- 没有打开sdk界面 %@ ",[DeviceUtil getUUIDByKeyChain]);
//        [[AlicomFusionManager shareInstance] start];
////            [AlicomFusionToastTool showToastMsg:@"token鉴权未完成" time:2];
//    }
    
    //以下是老版本 不用了
//    if(strToken){
//        if(isTokenExpired(strToken)){
//            NSLog(@"---Token11: 已过期");//过期就弹窗
//            [[IAPInterface sharedSingleton] guoqi:[DeviceUtil getUUIDByKeyChain]];
//        }else{
//            NSLog(@"---Token11: 未过期");//过期就弹窗
////            [[IAPInterface sharedSingleton] noguoqi:[DeviceUtil getUUIDByKeyChain]];
//            [[IAPInterface sharedSingleton] guoqi:[DeviceUtil getUUIDByKeyChain]];
//        }
//    }else{
//        NSLog(@"---Token00: 为空");//过期就弹窗
//        [[IAPInterface sharedSingleton] guoqi:[DeviceUtil getUUIDByKeyChain]];
//    }
}
+ (void)getDeviceIDFV:(NSString *)p{
    
//    AlicomFusionManager *phoneNum = [[AlicomFusionManager alloc]init];
    [[AlicomFusionManager shareInstance] dealWithPhone:p];
    // 保存用户凭据到NSUserDefaults
//    NSString *userId = [[NSUserDefaults standardUserDefaults] stringForKey:@"userId"];
//    NSString *strToken = [[NSUserDefaults standardUserDefaults] stringForKey:@"strToken"];
//    NSLog(@"-----用户已授权: %@", strToken);
//    
////        if (userId) {
////            // 用户已登录，直接跳转到首页或者其他已登录界面
////            NSLog(@"用户已登录，用户ID为：%@", userId);
////        } else {
////            // 用户未登录，显示登录按钮
////        }
//
//    LQAppleLogin *loginManager = [[LQAppleLogin alloc] init];
//    // 调用登录方法，并传入完成处理器
//    [loginManager loginWithCompleteHandler:^(BOOL success, NSString * _Nullable user, NSString * _Nullable familyName, NSString * _Nullable givenName, NSString * _Nullable email, NSString * _Nullable password, NSData * _Nullable identityToken, NSData * _Nullable authorizationCode, NSError * _Nullable error, NSString * _Nullable message) {
//        if (success) {
//            // 登录成功，处理逻辑
//            NSLog(@"---登录成功，用户信息：%@", givenName);
//            NSString*strToken =[[NSString alloc] initWithData:identityToken  encoding:NSUTF8StringEncoding];
//            [[IAPInterface sharedSingleton] test1:strToken withString:user];
//            
//        } else {
//            // 登录失败，处理逻辑
//            NSLog(@"登录失败，错误信息：%@", error.localizedDescription);
//            [[IAPInterface sharedSingleton] guoqi:[DeviceUtil getUUIDByKeyChain]];
//        }
//    }];
//    return;
//    if(strToken){
//        if(isTokenExpired(strToken)){
//            NSLog(@"---Token: 已过期");//过期就弹窗
//            
//            // 调用登录方法，并传入完成处理器
//            [loginManager loginWithCompleteHandler:^(BOOL success, NSString * _Nullable user, NSString * _Nullable familyName, NSString * _Nullable givenName, NSString * _Nullable email, NSString * _Nullable password, NSData * _Nullable identityToken, NSData * _Nullable authorizationCode, NSError * _Nullable error, NSString * _Nullable message) {
//                if (success) {
//                    // 登录成功，处理逻辑
//                    NSLog(@"---登录成功，用户信息：%@", givenName);
//                    NSString*strToken =[[NSString alloc] initWithData:identityToken  encoding:NSUTF8StringEncoding];
//                    [[IAPInterface sharedSingleton] test1:strToken withString:user];
//                    
//                } else {
//                    // 登录失败，处理逻辑
//                    NSLog(@"登录失败，错误信息：%@", error.localizedDescription);
//                    [[IAPInterface sharedSingleton] guoqi:[DeviceUtil getUUIDByKeyChain]];
//                }
//            }];
//        }else{
//            NSLog(@"---Token: 未过期");//未过期直接登录
//            // 调用方法并传入参数
//            [LQAppleLogin checkAuthorizationStateWithUser:userId completeHandler:^(BOOL authorized, NSString *msg) {
//                if (authorized) {
//                    NSLog(@"用户已授权: %@", msg);
////
//                    [[IAPInterface sharedSingleton] test1:strToken withString:userId];
//                    
//                } else {
//                    NSLog(@"用户未授权: %@", msg);
//                    // 在这里处理未授权的情况
//                    [loginManager loginWithExistingAccount:^(BOOL successed, NSString * _Nullable user, NSString * _Nullable familyName, NSString * _Nullable givenName, NSString * _Nullable email, NSString * _Nullable password, NSData * _Nullable identityToken, NSData * _Nullable authorizationCode, NSError * _Nullable error, NSString * _Nullable msg) {
//                            if (successed) {
//                                // 登录成功，可以使用返回的用户信息进行后续操作
//                                NSLog(@"登录成功，用户信息：%@", user);
//                                NSString*strToken =[[NSString alloc] initWithData:identityToken  encoding:NSUTF8StringEncoding];
//                                [[IAPInterface sharedSingleton] test1:strToken withString:user];
//                            } else {
//                                // 登录失败，处理错误信息
//                                NSLog(@"登录失败，错误信息：%@", msg);
//                                // 调用登录方法，并传入完成处理器
//                                [loginManager loginWithCompleteHandler:^(BOOL success, NSString * _Nullable user, NSString * _Nullable familyName, NSString * _Nullable givenName, NSString * _Nullable email, NSString * _Nullable password, NSData * _Nullable identityToken, NSData * _Nullable authorizationCode, NSError * _Nullable error, NSString * _Nullable message) {
//                                    if (success) {
//                                        // 登录成功，处理逻辑
//                                        NSLog(@"登录成功，用户信息：%@", user);
//                                        NSString*strToken =[[NSString alloc] initWithData:identityToken  encoding:NSUTF8StringEncoding];
//                                        [[IAPInterface sharedSingleton] test1:strToken withString:user];
//                                    } else {
//                                        // 登录失败，处理逻辑
//                                        NSLog(@"登录失败，错误信息：%@", error.localizedDescription);
//                                        [[IAPInterface sharedSingleton] guoqi:[DeviceUtil getUUIDByKeyChain]];
//                                    }
//                                }];
//                            }
//                        }];
//                }
//            }];

//        }
//    }else{
//        [loginManager loginWithCompleteHandler:^(BOOL success, NSString * _Nullable user, NSString * _Nullable familyName, NSString * _Nullable givenName, NSString * _Nullable email, NSString * _Nullable password, NSData * _Nullable identityToken, NSData * _Nullable authorizationCode, NSError * _Nullable error, NSString * _Nullable message) {
//            if (success) {
//                // 登录成功，处理逻辑
//                NSLog(@"---登录成功，用户信息：%@", givenName);
//                NSString*strToken =[[NSString alloc] initWithData:identityToken  encoding:NSUTF8StringEncoding];
//                [[IAPInterface sharedSingleton] test1:strToken withString:user];
//            } else {
//                // 登录失败，处理逻辑
//                NSLog(@"登录失败，错误信息：%@", error.localizedDescription);
//                [[IAPInterface sharedSingleton] guoqi:[DeviceUtil getUUIDByKeyChain]];
//            }
//        }];
//    }
    
       
};


//-----------上报------


// 用户登录操作
+ (void)userLogin:(NSString *)userData{
    NSLog(@"登录 信息：%@", userData);
    
    NSDictionary *jsonDict = [NSJSONSerialization JSONObjectWithData:[userData dataUsingEncoding:NSUTF8StringEncoding] options:kNilOptions error:NULL];
    
    NSString *appName = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleDisplayName"];
    QYUserInfo *userInfo = [[QYUserInfo alloc] init];
    userInfo.userId = jsonDict[@"userid"];
    
    NSString *name = [NSString stringWithFormat:@"%@(iOS/china_ios)-%@", appName, userInfo.userId];
    userInfo.data = [NSString stringWithFormat:@"[{\"key\":\"real_name\", \"value\":\"%@\"}]", name];

    [[QYSDK sharedSDK] setUserInfo:userInfo];

    [IAPInterface RestoreBuyProduct:@""];
}

// 用户登出操作
//- (IBAction)userLogout:(id)sender {
//    [[UOPUserManager sharedManager] logoutUser];
//}

//- (NSString *)_changeStatus:(UOPAggType )status {
//    switch (status) {
//        case UOPAggregationAttributionUndefined:
//            return @"不明确";
//            break;
//        case UOPAggregationAttributionDone:
//            return @"抖音渠道";
//        case UOPAggregationAttributionNot:
//            return @"自然量";
//        default:
//            return @"不明确";
//            break;
//    }
//}

//跳转url
+ (void)yonghu:(NSString *)p{
    NSURL *url = [NSURL URLWithString:@"https://hallcq.jpsdk.com/static/privacy/game/jueduifangyu2/userServiceAgreement.html"];
//    if ([[UIApplication sharedApplication] canOpenURL:url]) {
//        [[UIApplication sharedApplication] openURL:url];
//    }
    
    if (@available(iOS 10, *)) {
        // iOS 10 及以上版本
        [[UIApplication sharedApplication] openURL:url options:@{} completionHandler:nil];
    } else {
        // iOS 9 及以下版本
        [[UIApplication sharedApplication] openURL:url];
    }
}

+ (void)yingsi:(NSString *)p{
//    NSURL *url = [NSURL URLWithString:@"https://hallcq.jpsdk.com/static/privacy/hntanliang/privacyPolicy.html"];
    NSURL *url = [NSURL URLWithString:@"https://hallcq.jpsdk.com/static/privacy/game/jueduifangyu2/privacyPolicy.html"];
//    if ([[UIApplication sharedApplication] canOpenURL:url]) {
//        [[UIApplication sharedApplication] openURL:url];
//    }
    if (@available(iOS 10, *)) {
        // iOS 10 及以上版本
        [[UIApplication sharedApplication] openURL:url options:@{} completionHandler:nil];
    } else {
        // iOS 9 及以下版本
        [[UIApplication sharedApplication] openURL:url];
    }
}

//震动
+ (void) vibrateShort:(NSString*)info
{
    AudioServicesPlaySystemSound(kSystemSoundID_Vibrate);
}

+ (void) vibrateLong:(NSString*)info
{
    AudioServicesPlaySystemSound(kSystemSoundID_Vibrate);
}

+ (void)gailv:(NSString *)p{
    NSURL *url = [NSURL URLWithString:@"https://hallcq.jpsdk.com/static/iap/html/5001/gailv.html"];
    if ([[UIApplication sharedApplication] canOpenURL:url]) {
        [[UIApplication sharedApplication] openURL:url];
    }
}
// 复制文本到剪贴板
+ (void)copyTextToClipboard:(NSString *)text {
    UIPasteboard *pasteboard = [UIPasteboard generalPasteboard];
    [pasteboard setString:text];
}

+ (void)exitApp:(NSString *)p{
    exit(0);
}

+ (void)vibrateDevice:(NSString *)p{
    //------- 震动
        AudioServicesPlaySystemSound(kSystemSoundID_Vibrate);

}

//-----------key

+ (NSMutableDictionary*)getKeychainQuery:(NSString*)service {
    return[NSMutableDictionary dictionaryWithObjectsAndKeys:
           (id)kSecClassGenericPassword,(id)kSecClass,
           service,(id)kSecAttrService,
           service,(id)kSecAttrAccount,
           (id)kSecAttrAccessibleAfterFirstUnlock,(id)kSecAttrAccessible,
           nil];
}
 
+ (void)save:(NSString*)service data:(id)data{
    //Get search dictionary
    NSMutableDictionary*keychainQuery = [self getKeychainQuery:service];
    //Delete old item before add new item
    SecItemDelete((CFDictionaryRef)keychainQuery);
    //Add new object to searchdictionary(Attention:the data format)
    [keychainQuery setObject:[NSKeyedArchiver archivedDataWithRootObject:data]forKey:(id)kSecValueData];
    //Add item to keychain with the searchdictionary
    SecItemAdd((CFDictionaryRef)keychainQuery,NULL);
}
 
+ (id)load:(NSString*)service {
    id ret =nil;
    NSMutableDictionary*keychainQuery = [self getKeychainQuery:service];
    //Configure the search setting
    //Since in our simple case we areexpecting only a single attribute to be returned (the password) wecan set the attribute kSecReturnData to kCFBooleanTrue
    [keychainQuery setObject:(id)kCFBooleanTrue forKey:(id)kSecReturnData];
    [keychainQuery setObject:(id)kSecMatchLimitOne forKey:(id)kSecMatchLimit];
    CFDataRef keyData =NULL;
    if(SecItemCopyMatching((CFDictionaryRef)keychainQuery,(CFTypeRef*)&keyData) ==noErr){
        @try{
//           [NSKeyedUnarchiver unarchiveObjectWithData:(__bridge NSData*)keyData];
            ret = [NSKeyedUnarchiver unarchivedObjectOfClass:[NSDictionary class] fromData:keyData error:nil];
        }@catch(NSException *e) {
            NSLog(@"Unarchiveof %@ failed: %@",service, e);
        }@finally{
        }
    }
    if(keyData)
        CFRelease(keyData);
    return ret;
}
 
+ (void)deleteKeyData:(NSString*)service {
    NSMutableDictionary*keychainQuery = [self getKeychainQuery:service];
    SecItemDelete((CFDictionaryRef)keychainQuery);
}

/**  获取UUID*/
+ (NSString *)getUUIDByKeyChain{
    // 这个key的前缀最好是你的BundleID
    NSString*strUUID = (NSString*)[DeviceUtil load:@"com.ylgame.jueduifangyu"];
    //首次执行该方法时，uuid为空
    if([strUUID isEqualToString:@""]|| !strUUID)
    {
        // 获取UUID 这个是要引入<AdSupport/AdSupport.h>的
        strUUID = [[[ASIdentifierManager sharedManager] advertisingIdentifier] UUIDString];
        
        if(strUUID.length ==0 || [strUUID isEqualToString:@"00000000-0000-0000-0000-000000000000"])
        {
            //生成一个uuid的方法
            CFUUIDRef uuidRef= CFUUIDCreate(kCFAllocatorDefault);
            strUUID = (NSString*)CFBridgingRelease(CFUUIDCreateString(kCFAllocatorDefault,uuidRef));
            CFRelease(uuidRef);
        }
        
        //将该uuid保存到keychain
        [DeviceUtil save:@"com.ylgame.jueduifangyu" data:strUUID];
    }
    
    return strUUID;
}

+ (NSString*)getSystemInfo:(NSString *)p {
    NSMutableDictionary* info = [NSMutableDictionary new];

    UIDevice* device = [UIDevice currentDevice];
    [info setObject:@"ios" forKey:@"platform"];
    [info setObject:@"Apple" forKey:@"brand"];

    struct utsname systemInfo;
    uname(&systemInfo);
    [info setObject:[NSString stringWithCString:systemInfo.machine encoding:NSUTF8StringEncoding] forKey:@"model"];
    // [info setObject:device.name forKey:@"model"];

    [info setObject:[NSString stringWithFormat:@"iOS %@", device.systemVersion] forKey:@"system"];   // iOS 14

    
    NSData* dataInfo = [NSJSONSerialization dataWithJSONObject:info options:NSJSONWritingPrettyPrinted error:NULL];
    NSString* strInfo = [[NSString alloc] initWithData:dataInfo encoding:NSUTF8StringEncoding];
    
    NSLog(@"[DeviceUtil]getSystemInfo: %@", strInfo);
    
    return strInfo;
}



+ (void)openService:(NSString *)data {
    UIViewController *rootVC = [[UIApplication sharedApplication].delegate window].rootViewController;
    
    NSString *appName = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleDisplayName"];
    
    QYSource *source = [[QYSource alloc] init];
    source.title = [NSString stringWithFormat:@"%@-iOS", appName];
    QYSessionViewController *sessionViewController = [[QYSDK sharedSDK] sessionViewController];
    sessionViewController.sessionTitle = @"客服";
    sessionViewController.source = source;
    UINavigationController *nav = [[UINavigationController alloc] initWithRootViewController:sessionViewController];
    [rootVC presentViewController:nav animated:YES completion:nil];
    
    UIBarButtonItem *leftItem = [[UIBarButtonItem alloc] initWithTitle:@"关闭" style:UIBarButtonItemStylePlain target:sessionViewController action: @selector(dismissModalViewControllerAnimated:)];
    sessionViewController.navigationItem.leftBarButtonItem = leftItem;
}

@end

