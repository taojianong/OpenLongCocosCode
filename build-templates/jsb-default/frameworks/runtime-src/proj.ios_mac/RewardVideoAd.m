//
//  TTRewardVideoAdViewController.m
//  cdnmq_ios
//
//  Created by fneal on 2021/9/1.
//  Copyright © 2021 cdnmq_ios. All rights reserved.
//
#import "IAPInterface.h"
#import "RewardVideoAd.h"

#import "WindSDK/WindSDK.h"
#import "WindMillSDK/WindMillSDK.h"
#import "ToastView.h"

@interface RewardVideoAd ()<WindMillRewardVideoAdDelegate>
@property (nonatomic,assign) BOOL isReward;
//@property (nonatomic, strong) BURewardedVideoAd *adView;
//@property (nonatomic, strong) BUNativeExpressRewardedVideoAd *rewardedVideoAd;
//@property (nonatomic,assign) BOOL isShowAd;
//
@end
//static RewardVideoAd* m_instance;
@implementation RewardVideoAd

NSString *_transId = @"";
BOOL isLoad = YES;
BOOL _loading = NO;
BOOL _isfirst = YES;
WindMillRewardVideoAd *_video;
-(void)initAd
{
    //[super viewDidLoad];
//    NSLog(@"---viewDidLoad %@",p);
//    _VideoUserid = p;
//    NSLog(@"---viewDidLoad-- %@",_VideoUserid);
//    m_instance = self;
    _loading = NO;
    [self preLoade];
    
}

/******** 激励广告配置 *********/
- (void)loadAd {
//    
//    BUAdSlot *slot = [[BUAdSlot alloc] init];
////    slot.ID = @"962576595"; // 聚合维度使用广告位ID发起请求，仅接入CSJ广告使用代码位ID发起请求
//    slot.ID = @"945494739"; // 聚合维度使用广告位ID发起请求，仅接入CSJ广告使用代码位ID发起请求
//    slot.mediation.mutedIfCan = YES; // 静音（聚合维度设置）
//  
//    // 奖励发放设置 没什么用
//    BURewardedVideoModel *rewardedVideoModel = [[BURewardedVideoModel alloc] init];
//    rewardedVideoModel.rewardName = @"金币"; // 奖励名称
//    rewardedVideoModel.rewardAmount = 1000;  // 奖励数量
//    rewardedVideoModel.extra = ({
//        // 透传参数
//            NSDictionary *extra = @{
//                @"value": @"10",
//            };
//
//        NSData *data = [NSJSONSerialization dataWithJSONObject:extra options:NSJSONWritingSortedKeys error:NULL];
//        NSString *json = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
//        json;
//    });
//
//    BUNativeExpressRewardedVideoAd *rewardedVideoAd = [[BUNativeExpressRewardedVideoAd alloc] initWithSlot:slot rewardedVideoModel:rewardedVideoModel];
//    rewardedVideoAd.delegate = self;
    // optional
//        self.rewardedVideoAd.rewardPlayAgainInteractionDelegate = self.rewardedVideoAgainDelegateObj;
    // 设置竖屏 （聚合维度功能）
//    [rewardedVideoAd.mediation addParam:@(0) withKey:@"show_direction"];
//    self.rewardedVideoAd = rewardedVideoAd;
//    [rewardedVideoAd loadAdData];
    
}



            //************************************************************* 新穿山甲sdk **********************************
//+(RewardVideoAd*) getInstance
//{
//    if (m_instance == NULL)
//    {
//        NSLog(@"获取m_instance失败");
//    }
//    return m_instance;
//}

//拉起视频广告
-(void) ShowRewardVideoAdEx
{
    if(isLoad == YES){
        NSLog(@"%@",@"---YES1111");
        [self showRewardVideoAd];

    }else{
        NSLog(@"%@",@"---视频没加载好");
//        [WHToast showMessage:@"视频加载中" originY:200 duration:3 finishHandler:nil];
        _loading = NO;
        [self preLoade];
    }
}

-(void)preLoade{
    NSLog(@"------preLoade");
    
    
    WindMillAdRequest *request = [WindMillAdRequest request];
    request.userId = @"user_id";
    request.placementId = VIDEO_ID;//这是正式
//    request.placementId = @"5161749878887362";//这是测试id
    
    request.options = @{@"test_key":@"test_value"};//s2s激励时自定义参数
    //rewardVideoAd全局对象，后续可以使用平台提供的预加载功能提高填充速度
    if (_video == nil&&_loading == NO) {
        _loading = YES;
        _video = [[WindMillRewardVideoAd alloc] initWithRequest:request];
        _video.delegate = self;
        [_video loadAdData];
    }else {
//        [_video resetRequestOptions:@{@"test_key2":@"test_value2"}];
        [_video loadAdData];
    }
    
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

-(void) showRewardVideoAd
{
    NSLog(@"展示奖励视频广告");
    isLoad = NO;
    self.isReward = NO;
    if (_video == nil){
        NSLog(@"%@",@"---YES222");
        
        [self preLoade];

    }else{
        NSLog(@"%@",@"---NO1111");
        [_video showAdFromRootViewController:[self theTopviewControler] options:nil];
            _video = nil;
        
        //    RewardVideoAd *video = [[RewardVideoAd alloc] init];
            [self preLoade];
    }
  
   
}



#pragma mark - WindMillRewardVideoAdDelegate

- (void)rewardVideoAdDidLoad:(WindMillRewardVideoAd *)rewardVideoAd {
    NSLog(@"%@ -1- %@", NSStringFromSelector(_cmd), rewardVideoAd.placementId);
//    if (self._rewardVideoAd == nil){
//        NSLog(@"%@",@"---self.rewardVideoAd333nil");
//    }else{
        NSLog(@"%@",@"---self.rewardVideoAd333");
//
//        _video = self._rewardVideoAd;
////
//    }
    _loading = NO;
    isLoad = YES;
    _video = rewardVideoAd;
//    [self.view.window makeToast:NSStringFromSelector(_cmd) duration:1 position:CSToastPositionBottom];
//    [self updateFromRowDisableWithTag:kAdDidLoad error:nil];
}

- (void)rewardVideoAdDidLoad:(WindMillRewardVideoAd *)rewardVideoAd didFailWithError:(NSError *)error {
    NSLog(@"%@ -2- %@", NSStringFromSelector(_cmd), rewardVideoAd.placementId);
    NSLog(@"视频广告失败 %@", error);
    
    if(_isfirst==NO){
        
        [ToastView showToastMsg:@"暂无广告" inView:[self theTopviewControler].view];
    }
    _isfirst=NO;
//    [WHToast showMessage:@"当前无合适广告,请稍后重试" originY:200 duration:3 finishHandler:nil];
//    [self.view.window makeToast:NSStringFromSelector(_cmd) duration:1 position:CSToastPositionBottom];
//    [self updateFromRowDisableWithTag:kAdDidLoadError error:error];
}

- (void)rewardVideoAdWillVisible:(WindMillRewardVideoAd *)rewardVideoAd {
    NSLog(@"%@ -3- %@", NSStringFromSelector(_cmd), rewardVideoAd.placementId);
//    [self.view.window makeToast:NSStringFromSelector(_cmd) duration:1 position:CSToastPositionBottom];
//    [self updateFromRowDisableWithTag:kAdWillVisible error:nil];
}

- (void)rewardVideoAdDidVisible:(WindMillRewardVideoAd *)rewardVideoAd {
    NSLog(@"%@ -4- %@", NSStringFromSelector(_cmd), rewardVideoAd.placementId);
    
    
//    [self.view.window makeToast:NSStringFromSelector(_cmd) duration:1 position:CSToastPositionBottom];
//    [self updateFromRowDisableWithTag:kAdDidVisible error:nil];
}

- (void)rewardVideoAdDidClick:(WindMillRewardVideoAd *)rewardVideoAd {
    NSLog(@"%@ -5- %@", NSStringFromSelector(_cmd), rewardVideoAd.placementId);
//    [self.view.window makeToast:NSStringFromSelector(_cmd) duration:1 position:CSToastPositionBottom];
//    [self updateFromRowDisableWithTag:kAdDidClick error:nil];
}

- (void)rewardVideoAdDidClickSkip:(WindMillRewardVideoAd *)rewardVideoAd {
    NSLog(@"%@ -6- %@", NSStringFromSelector(_cmd), rewardVideoAd.placementId);
//    isShow = YES;
//    _video = nil;
//    RewardVideoAd *video = [[RewardVideoAd alloc] init];
//    [video preLoade];
//    [self.view.window makeToast:NSStringFromSelector(_cmd) duration:1 position:CSToastPositionBottom];
//    [self updateFromRowDisableWithTag:kAdDidSkip error:nil];
}

- (void)rewardVideoAd:(WindMillRewardVideoAd *)rewardVideoAd reward:(WindMillRewardInfo *)reward {
    NSLog(@"%@ -7- %@", NSStringFromSelector(_cmd), rewardVideoAd.placementId);
//
    //发奖
    NSLog(@"看完广告返回11 发放奖励 ");
    if(reward.isCompeltedView == YES){
        _transId = reward.transId;
        self.isReward = YES;
    }
        
        
//    [self.view.window makeToast:NSStringFromSelector(_cmd) duration:1 position:CSToastPositionBottom];
//    [self updateFromRowDisableWithTag:kAdDidReward error:nil];
}

- (void)rewardVideoAdDidClose:(WindMillRewardVideoAd *)rewardVideoAd {
    NSLog(@"%@ -8- %@", NSStringFromSelector(_cmd), rewardVideoAd.placementId);

//    _video = nil;
//    RewardVideoAd *video = [[RewardVideoAd alloc] init];
    _loading = NO;
    [self preLoade];
    if(self.isReward == YES){
         
        [[IAPInterface sharedSingleton] isReward:_transId];

    } else {
        [[IAPInterface sharedSingleton] onAdFail:_transId];
    }
    
    
//    RewardVideoAd *video = [[RewardVideoAd alloc] init];
//    [video preLoade];
//    [self.view.window makeToast:NSStringFromSelector(_cmd) duration:1 position:CSToastPositionBottom];
//    [self updateFromRowDisableWithTag:kAdDidClose error:nil];
}

- (void)rewardVideoAdDidPlayFinish:(WindMillRewardVideoAd *)rewardVideoAd didFailWithError:(NSError *)error {
    NSLog(@"%@ -9- %@", NSStringFromSelector(_cmd), rewardVideoAd.placementId);
//    [self.view.window makeToast:NSStringFromSelector(_cmd) duration:1 position:CSToastPositionBottom];
//    [self updateFromRowDisableWithTag:kAdDidPlayFinish error:error];
}


@end

