#import "IAPInterface.h"
#import "IAPManager.h"
#import "cocos/platform/CCApplication.h"
#import "cocos/base/CCScheduler.h"
#import "cocos/scripting/js-bindings/jswrapper/SeApi.h"

 
@interface IAPInterface()
 
@property  IAPManager *iapManager;
@end
 
@implementation IAPInterface
 
+ (instancetype)sharedSingleton {
   static IAPInterface *_sharedSingleton = nil;
   static dispatch_once_t onceToken;
   dispatch_once(&onceToken, ^{
       //不能再使用alloc方法
       //因为已经重写了allocWithZone方法，所以这里要调用父类的分配空间的方法
       if (_sharedSingleton==nil) {
           _sharedSingleton = [[super allocWithZone:NULL] init];
       }
       //[_sharedSingleton initDelegate];
       //[_sharedSingleton checkTransaction];
   });
   return _sharedSingleton;
}
 
/**
 //初始化商品信息
 */
+ (void) InitIAPManager{
    NSLog(@"InitIAPManagerUser");
    [[IAPInterface sharedSingleton] InitIAPManagerUser];
    
}
 
- (void) InitIAPManagerUser{
   
    self.iapManager=[[IAPManager alloc] init];
    [self.iapManager attachObserver];
    
}
 

//判断用户是否可以付费
+ (bool) IsProductAvailable{
    return [[IAPInterface sharedSingleton] IsProductAvailableUser];
}
- (bool) IsProductAvailableUser{
   
    return [self.iapManager CanMakePayment];
}
 
//获取商品信息
+ (void) RequstProductInfo:(NSString *)p{
    NSLog(@"商品列表:%@",p);
    [[IAPInterface sharedSingleton] RequstProductInfoUser:p];
}
 
- (void) RequstProductInfoUser:(NSString *)p{
        [self.iapManager requestProductData:p];
}
 
//购买商品
+ (void) BuyProduct:(NSString *)p{
    NSLog(@"购买:%@",p);
    [[IAPInterface sharedSingleton] BuyProductUser:p];
    
    //[IAPInterface RestoreBuyProduct:p];
}
 
- (void) BuyProductUser:(NSString *)p{
    [self.iapManager buyRequest:p];
}
 
//恢复购买商品
+ (void) RestoreBuyProduct:(NSString *)p{
    NSLog(@"恢复购买:%@",p);
    [[IAPInterface sharedSingleton] RestoreBuyProductUser:p];
    
}
 
- (void) RestoreBuyProductUser:(NSString *)p{
    [self.iapManager Restore:p];
}
 
 
/// <summary>
/// 购买商品成功的回调
/// </summary>
/// <param name="str">String.</param>
- (void) BuyProcuctSucessCallBack:(NSString *)str
{
    NSLog(@"-----ObjectToJs----BuyProcuctSucessCallBack-------");
    
    NSString *bodyString = [NSString stringWithFormat:@"window.PlatformApi.BuyProcuctSucessCallBack(\'%@'\)", str];//拼接请求数据
    NSLog(bodyString);
    std::string param1=[bodyString UTF8String];
    dispatch_async(dispatch_get_main_queue(), ^{
                    // 这段代码会在主线程中执行
        se::ScriptEngine::getInstance()->evalString(param1.c_str());
    });
   //通过evalString执行上面的代码
//   se::ScriptEngine::getInstance()->evalString(param1.c_str());
}
 
/// <summary>
/// 购买商品失败的回调
/// </summary>
/// <param name="str">String.</param>
- (void) BuyProcuctFailedCallBack:(NSString *)str
{
    NSLog(@"-----ObjectToJs----BuyProcuctFailedCallBack-------");
    
        NSString *bodyString = [NSString stringWithFormat:@"window.PlatformApi.BuyProcuctFailedCallBack(%@)", str];//拼接请求数据
        NSLog(bodyString);
        std::string param1=[bodyString UTF8String];
    dispatch_async(dispatch_get_main_queue(), ^{
       //通过evalString执行上面的代码
       se::ScriptEngine::getInstance()->evalString(param1.c_str());
    });
    
}
 
/// <summary>
/// 产品反馈信息回掉-
/// </summary>
/// <param name="str">String.</param>
- (void) ShowProductList:(NSString *)str
{
    NSLog(@"-----ObjectToJs----ShowProductList-------");
    dispatch_async(dispatch_get_main_queue(), ^{
        NSString *bodyString = [NSString stringWithFormat:@"window.PlatformApi.ShowProductList(%@)", str];//拼接请求数据
        
        std::string param1=[bodyString UTF8String];
       //通过evalString执行上面的代码
       se::ScriptEngine::getInstance()->evalString(param1.c_str());
    });
    
}
 
/// <summary>
/// 恢复购买的商品完成的回调
/// </summary>
/// <param name="str">String.</param>
- (void) RestoreBuyProductSucessCallBack:(NSString *)strId
{
    NSLog(@"-----ObjectToJs----RestoreBuyProductSucessCallBack-------");
    
    NSString *bodyString = [NSString stringWithFormat:@"window.PlatformApi.RestoreBuyProductSucessCallBack(%@)", strId];
    //NSLog(bodyString);
    std::string param1=[bodyString UTF8String];
    dispatch_async(dispatch_get_main_queue(), ^{
        //通过evalString执行上面的代码
        se::ScriptEngine::getInstance()->evalString(param1.c_str());
    });
   
}
 
- (void) test1:(NSString *)token withString:(NSString *)uid
{
    
    NSLog(@"-----ObjectToJs----test1 -------");
    dispatch_async(dispatch_get_main_queue(), ^{
    NSString *bodyString = [NSString stringWithFormat:@"window.ChinaIos.backLogin(\'%@'\,\'%@'\)", token,uid];//拼接请求数据
//    NSLog(bodyString);
    std::string param1=[bodyString UTF8String];
    
//    printf("%s", param1.c_str());
                    // 这段代码会在主线程中执行
        se::ScriptEngine::getInstance()->evalString([bodyString UTF8String]);
    });
//   //通过evalString执行上面的代码
//   se::ScriptEngine::getInstance()->evalString(param1.c_str());
    
}

- (void) setGuestToken:(NSString *)token
{
    NSLog(@"-----ObjectToJs----setGuestToken -------");
    dispatch_async(dispatch_get_main_queue(), ^{
    NSString *bodyString = [NSString stringWithFormat:@"window.ChinaIos.setGuestToken(\'%@'\)", token];//拼接请求数据
//    NSLog(bodyString);
    std::string param1=[bodyString UTF8String];
        // 这段代码会在主线程中执行
        se::ScriptEngine::getInstance()->evalString([bodyString UTF8String]);
    });
}

- (void) guoqi:(NSString *)token
{
    NSLog(@"-----ObjectToJs----guoqi -------");
    dispatch_async(dispatch_get_main_queue(), ^{
    NSString *bodyString = [NSString stringWithFormat:@"window.GameLoadingState.guoqi(\'%@'\)", token];//拼接请求数据
//    NSLog(bodyString);
    std::string param1=[bodyString UTF8String];
        // 这段代码会在主线程中执行
        se::ScriptEngine::getInstance()->evalString([bodyString UTF8String]);
    });
}

- (void) savedDeviceId:(NSString *)token
{
    NSLog(@"-----ObjectToJs----savedDeviceId -------");
    dispatch_async(dispatch_get_main_queue(), ^{
    NSString *bodyString = [NSString stringWithFormat:@"window.ChinaIos.savedDeviceId(\'%@'\)", token];//拼接请求数据
//    NSLog(bodyString);
    std::string param1=[bodyString UTF8String];
        // 这段代码会在主线程中执行
        se::ScriptEngine::getInstance()->evalString([bodyString UTF8String]);
    });
}

- (void) isReward:(NSString *)token
{
    NSLog(@"-----ObjectToJs----video reward -------");
    dispatch_async(dispatch_get_main_queue(), ^{
    NSString *bodyString = [NSString stringWithFormat:@"window.ChinaIos.isReward(\'%@'\)",token];//拼接请求数据
//    NSLog(bodyString);
    std::string param1=[bodyString UTF8String];
        // 这段代码会在主线程中执行
        se::ScriptEngine::getInstance()->evalString([bodyString UTF8String]);
    });
}

- (void) onAdFail:(NSString *)token {
    dispatch_async(dispatch_get_main_queue(), ^{
        NSString *bodyString = [NSString stringWithFormat:@"window.ChinaIos.onAdFail(\'%@'\)", token];
        se::ScriptEngine::getInstance()->evalString([bodyString UTF8String]);
    });
}

@end
