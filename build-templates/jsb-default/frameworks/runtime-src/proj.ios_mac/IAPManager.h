#import <Foundation/Foundation.h>
#import <StoreKit/StoreKit.h>
 
@interface IAPManager : NSObject<SKProductsRequestDelegate, SKPaymentTransactionObserver>{
    SKProduct *proUpgradeProduct;
    SKProductsRequest *productsRequest;
//    NSString *productIndentify;
    
    
}
@property (nonatomic, copy) NSString *productIndentify;
-(void)attachObserver;
-(BOOL)CanMakePayment;
-(void)requestProductData:(NSString *)productIdentifiers;
-(void)buyRequest:(NSString *)productIdentifier;//购买
-(void)Restore:(NSString *)productIdentifier;
@end
