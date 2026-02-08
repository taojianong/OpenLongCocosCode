//
//  AlicomFusionAuthTokenManager.m
//  AlicomFusionAuthDemo
//
//  Created by yanke on 2023/2/10.
//

#import "AlicomFusionManager.h"
#import "AlicomFusionAuthTokenManager.h"
#import "AlicomFusionNetAdapter.h"
#import "ToastView.h"

static BOOL g_working_flag = NO;

@interface AlicomFusionAuthTokenManager ()
@property(nonatomic) dispatch_semaphore_t asema;
@end

@implementation AlicomFusionAuthTokenManager

- (instancetype)init
{
    self = [super init];
    if (self) {
        self.asema=dispatch_semaphore_create(0);
    }
    return self;
}

+ (instancetype)shareInstance {
    static AlicomFusionAuthTokenManager *instance = nil ;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        if (instance == nil) {
            instance = [[AlicomFusionAuthTokenManager alloc] init];
        }
    });
    return instance;
}
+ (UIView *)theTopView {
    
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

+ (void)getAuthToken:(void(^)(NSString *tokenStr, NSString *errorMsg))complete{
    
    NSString *tokenStr = [AlicomFusionAuthTokenManager shareInstance].authTokenStr;

    if ((g_working_flag||tokenStr.length > 0)&&[AlicomFusionManager shareInstance].isGuest == NO){
        [ToastView showToastMsg:@"您已绑定账号" inView:[self theTopView]];
        return;
    }
    g_working_flag = YES;
    [AlicomFusionNetAdapter getTokenRequestComplete:^(NSString * _Nonnull data, NSError * _Nonnull error) {
        if (data&&!error){
            [AlicomFusionAuthTokenManager shareInstance].authTokenStr = data;
        }
        g_working_flag = NO;
        if (complete){
            complete(data, error.userInfo[NSLocalizedDescriptionKey]);
        }
    }];
}

+ (NSString *)updateAuthToken{
    if (g_working_flag){
        return nil;
    }
    g_working_flag = YES;
    [AlicomFusionNetAdapter getTokenRequestComplete:^(NSString * _Nonnull data, NSError * _Nonnull error) {
        if (data&&!error){
            [AlicomFusionAuthTokenManager shareInstance].authTokenStr = data;
        }
        // 使信号的信号量+1，这里的信号量本来为0，+1信号量为1(绿灯)
        dispatch_semaphore_signal([AlicomFusionAuthTokenManager shareInstance].asema);
        g_working_flag = NO;
    }];
    // 开启信号等待，设置等待时间为永久，直到信号的信号量大于等于1（绿灯）
    dispatch_semaphore_wait([AlicomFusionAuthTokenManager shareInstance].asema, DISPATCH_TIME_FOREVER);
    return [AlicomFusionAuthTokenManager shareInstance].authTokenStr;
}


+ (void)logout {
    [AlicomFusionAuthTokenManager shareInstance].authTokenStr = nil;
}


@end
