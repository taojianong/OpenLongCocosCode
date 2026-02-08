/****************************************************************************
 Copyright (c) 2010-2013 cocos2d-x.org
 Copyright (c) 2013-2016 Chukong Technologies Inc.
 Copyright (c) 2017-2018 Xiamen Yaji Software Co., Ltd.
 
 http://www.cocos2d-x.org
 
 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:
 
 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.
 
 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/

#import "AppController.h"
#import "cocos2d.h"
#import "AppDelegate.h"
#import "RootViewController.h"
#import "SDKWrapper.h"
#import "platform/ios/CCEAGLView-ios.h"

//#import "DeviceUtil.h"
#import "AppController.h"
#import "AppDelegate.h"
#import "IAPInterface.h"
#import <AuthenticationServices/AuthenticationServices.h>
#import "LQAppleLogin.h"
#import <AppTrackingTransparency/AppTrackingTransparency.h>
#import <AdSupport/ASIdentifierManager.h>

//#import "addCode/addqLniUCex.h"
#import "WindSDK/WindSDK.h"
#import "WindMillSDK/WindMillSDK.h"
#import "RewardVideoAd.h"
#import "LoginViewController.h"
#import "AccountViewController.h"

#import "AlicomFusionManager.h"
#import "BUAdSDK/BUAdSDKManager.h"
#import "BUAdSDK/BUAdSDKConfiguration.h"

#include <QYSDK/QYSDK.h>

using namespace cocos2d;

@implementation AppController

Application* app = nullptr;
@synthesize window;

#pragma mark -
#pragma mark Application lifecycle



- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
    // SDK初始化接口
    [WindMillAds setupSDKWithAppId:APPID];//16990。这是测试id   56168正式id
//    AWMSDKConfigure *sigmobConfigure = [[AWMSDKConfigure alloc] initWithAdnId:WindMillAdnSigmob appid:APPID appKey:@"d81cf65bb8cc9d82"];
//    AWMSDKConfigure *csjConfigure = [[AWMSDKConfigure alloc] initWithAdnId:WindMillAdnCSJ appid:@"5597636" appKey:nil];
////    //videoid
//    [WindMillAds setupSDKWithAppId:APPID sdkConfigures:@[sigmobConfigure,csjConfigure]];
    
    [[SDKWrapper getInstance] application:application didFinishLaunchingWithOptions:launchOptions];
    // Add the view controller's view to the window and display.
    float scale = [[UIScreen mainScreen] scale];
    CGRect bounds = [[UIScreen mainScreen] bounds];
    window = [[UIWindow alloc] initWithFrame: bounds];
    
    // cocos2d application instance
    app = new AppDelegate(bounds.size.width * scale, bounds.size.height * scale);
    app->setMultitouch(true);
    
    // Use RootViewController to manage CCEAGLView
    _viewController = [[RootViewController alloc]init];
#ifdef NSFoundationVersionNumber_iOS_7_0
    _viewController.automaticallyAdjustsScrollViewInsets = NO;
    _viewController.extendedLayoutIncludesOpaqueBars = NO;
    _viewController.edgesForExtendedLayout = UIRectEdgeAll;
#else
    _viewController.wantsFullScreenLayout = YES;
#endif
    
    LoginViewController *loginVC = [[LoginViewController alloc] initWithNibName:@"LoginViewController" bundle:nil];
//    [window setRootViewController:loginVC];
    AccountViewController *accountVC = [[AccountViewController alloc] initWithNibName:@"AccountViewController" bundle:nil];
    
    // Set RootViewController to window
    if ( [[UIDevice currentDevice].systemVersion floatValue] < 6.0)
    {
        // warning: addSubView doesn't work on iOS6
//        [window addSubview: _viewController.view];
        [window addSubview:loginVC.view];
    }
    else
    {
        // use this method on ios6
        [window setRootViewController:_viewController];
//        [window setRootViewController:loginVC];
//        [window setRootViewController:accountVC];
        

    }
    //进入sdk
//    [[AlicomFusionManager shareInstance] start];
    
    [window makeKeyAndVisible];
    [IAPInterface InitIAPManager];
    
    [[UIApplication sharedApplication] setStatusBarHidden:YES];
//    [addTest init];//废代码
//    UITouchShWDefUyaSdjY* cPQl = [UITouchShWDefUyaSdjY alloc];
//    [cPQl mqiHFCEDA];

    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(5.0f * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
        [self requestIDFATracking];
    });
    //run the cocos2d-x game scene
    app->start();
    
    [self initSDK];
    
    return YES;
}

- (void)initSDK{
    NSString *appName = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleDisplayName"];
    
    NSString *appKey = @"418fdeb4dfe32c14ddf3c787a08f8b8a";
    QYSDKOption *option = [QYSDKOption optionWithAppKey:appKey];
    [[QYSDK sharedSDK] registerWithOption:option];
}

- (void)applicationWillResignActive:(UIApplication *)application {
    /*
     Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
     Use this method to pause ongoing tasks, disable timers, and throttle down OpenGL ES frame rates. Games should use this method to pause the game.
     */
    app->onPause();
    [[SDKWrapper getInstance] applicationWillResignActive:application];
}

- (void)requestIDFATracking {
    if (@available(iOS 14, *)) {
        // iOS14及以上版本需要先请求权限
        [ATTrackingManager requestTrackingAuthorizationWithCompletionHandler:^(ATTrackingManagerAuthorizationStatus status) {
            // 获取到权限后，依然使用老方法获取idfa
            if (status == ATTrackingManagerAuthorizationStatusAuthorized) {
                NSString *idfa = [[ASIdentifierManager sharedManager].advertisingIdentifier UUIDString];
                    NSLog(@"--- >14 idfa :%@",idfa);
            } else {
                NSLog(@"请在设置-隐私-跟踪中允许App请求跟踪");
            }
        }];
        
    } else {
        // iOS14以下版本依然使用老方法
        // 判断在设置-隐私里用户是否打开了广告跟踪
        if ([[ASIdentifierManager sharedManager] isAdvertisingTrackingEnabled]) {
            NSString *idfa = [[ASIdentifierManager sharedManager].advertisingIdentifier UUIDString];
            NSLog(@"--- <= 14 idfa :%@",idfa);
        } else {
            NSLog(@"请在设置-隐私-广告中打开广告跟踪功能");
        }
    }
    //预加载广告
    RewardVideoAd *video = [[RewardVideoAd alloc] init];
    [video initAd];
}
- (void)setupOSDK {
    
    
}
- (void)applicationDidBecomeActive:(UIApplication *)application {
    /*
     Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
     */
    app->onResume();
    [[SDKWrapper getInstance] applicationDidBecomeActive:application];
}

- (void)applicationDidEnterBackground:(UIApplication *)application {
    /*
     Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
     If your application supports background execution, called instead of applicationWillTerminate: when the user quits.
     */
    [[SDKWrapper getInstance] applicationDidEnterBackground:application]; 
}

- (void)applicationWillEnterForeground:(UIApplication *)application {
    /*
     Called as part of  transition from the background to the inactive state: here you can undo many of the changes made on entering the background.
     */
    [[SDKWrapper getInstance] applicationWillEnterForeground:application]; 
}

- (void)applicationWillTerminate:(UIApplication *)application
{
    [[SDKWrapper getInstance] applicationWillTerminate:application];
    delete app;
    app = nil;
}


#pragma mark -
#pragma mark Memory management

- (void)applicationDidReceiveMemoryWarning:(UIApplication *)application {
    /*
     Free up as much memory as possible by purging cached data objects that can be recreated (or reloaded from disk) later.
     */
}

@end
