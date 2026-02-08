#import <Foundation/Foundation.h>
 
NS_ASSUME_NONNULL_BEGIN
 
@interface IAPInterface : NSObject
+ (instancetype)sharedSingleton;
 
+ (void) InitIAPManager;
+ (bool) IsProductAvailable;
+ (void) RequstProductInfo :(NSString *)p;
+ (void) BuyProduct :(NSString *)p;
+ (void) RestoreBuyProduct :(NSString *)p;
 
- (void) BuyProcuctSucessCallBack:(NSString *)str;
- (void) BuyProcuctFailedCallBack:(NSString *)str;
- (void) ShowProductList:(NSString *)str;
- (void) RestoreBuyProductSucessCallBack:(NSString *)str;
- (void) setGuestToken:(NSString *)token;
- (void) test1:(NSString *)token withString:(NSString *)uid;
- (void) guoqi:(NSString *)token;
- (void) savedDeviceId:(NSString *)token;
- (void) isReward:(NSString *)token;
- (void) onAdFail:(NSString *)token;

@end
 
NS_ASSUME_NONNULL_END
