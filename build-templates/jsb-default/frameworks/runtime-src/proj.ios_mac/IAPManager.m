#import "IAPManager.h"
#import "IAPInterface.h"
 
@implementation IAPManager
 
//初始化
-(void) attachObserver{
    NSLog(@"AttachObserver");
    [[SKPaymentQueue defaultQueue] addTransactionObserver:self];
}
 
//判断用户是否可以付费
-(BOOL) CanMakePayment{
    return [SKPaymentQueue canMakePayments];
}
 
//已内购的内容，恢复购买
-(void) Restore:(NSString *)productIdentifier{
    NSLog(@"Restore");
    [[SKPaymentQueue defaultQueue]  restoreCompletedTransactions];
}
 
//请求商品数据
-(void) requestProductData:(NSString *)productIdentifiers{
    NSArray *idArray = [productIdentifiers componentsSeparatedByString:@"\t"];
    NSSet *idSet = [NSSet setWithArray:idArray];
    [self sendRequest:idSet];
}
 
-(void)sendRequest:(NSSet *)idSet{
    SKProductsRequest *request = [[SKProductsRequest alloc] initWithProductIdentifiers:idSet];
    request.delegate = self;
    [request start];
}
 
-(void)productsRequest:(SKProductsRequest *)request didReceiveResponse:(SKProductsResponse *)response{
    
    NSLog(@"-----------收到产品反馈信息--------------");
    NSArray *products = response.products;
    NSLog(@"产品Product ID:%@",response.invalidProductIdentifiers);
    NSLog(@"产品付费数量: %d", (int)[products count]);
    // populate UI
    
    for (SKProduct *p in products) {
        NSLog(@"product info");
        NSLog(@"SKProduct 描述信息%@", [products description]);
        NSLog(@"产品标题 %@" , p.localizedTitle);
        NSLog(@"产品描述信息: %@" , p.localizedDescription);
        NSLog(@"价格: %@" , p.price);
        NSLog(@"Product id: %@" , p.productIdentifier);
        
        
        //UnitySendMessage("IOSIAPMgr", "ShowProductList", [[self productInfo:p] UTF8String]);
        NSString *pps= [self productInfo:p];
        [[IAPInterface sharedSingleton] ShowProductList:pps];
    }
    
    for(NSString *invalidProductId in response.invalidProductIdentifiers){
        
        NSLog(@"Invalid product id:%@",invalidProductId);
    }
    
    // [request autorelease];
}
 
//请求购买
-(void)buyRequest:(NSString *)productIdentifier{
    self.productIndentify = productIdentifier;
    SKMutablePayment *payment = [SKMutablePayment paymentWithProductIdentifier:productIdentifier];
    [[SKPaymentQueue defaultQueue] addPayment:payment];
}
 
-(NSString *)productInfo:(SKProduct *)product{
    NSArray *info = [NSArray arrayWithObjects:product.localizedTitle,product.localizedDescription,product.price,product.productIdentifier, nil];
    
    return [info componentsJoinedByString:@"\t"];
}
 
-(NSString *)transactionInfo:(SKPaymentTransaction *)transaction{
    
    return [self encode:(uint8_t *)transaction.transactionReceipt.bytes length:transaction.transactionReceipt.length];
    
    //return [[NSString alloc] initWithData:transaction.transactionReceipt encoding:NSASCIIStringEncoding];
}
 
-(NSString *)encode:(const uint8_t *)input length:(NSInteger) length{
    static char table[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    
    NSMutableData *data = [NSMutableData dataWithLength:((length+2)/3)*4];
    uint8_t *output = (uint8_t *)data.mutableBytes;
    
    for(NSInteger i=0; i<length; i+=3){
        NSInteger value = 0;
        for (NSInteger j= i; j<(i+3); j++) {
            value<<=8;
            
            if(j<length){
                value |=(0xff & input[j]);
            }
        }
        
        NSInteger index = (i/3)*4;
        output[index + 0] = table[(value>>18) & 0x3f];
        output[index + 1] = table[(value>>12) & 0x3f];
        output[index + 2] = (i+1)<length ? table[(value>>6) & 0x3f] : '=';
        output[index + 3] = (i+2)<length ? table[(value>>0) & 0x3f] : '=';
    }
    
    return [[NSString alloc] initWithData:data encoding:NSASCIIStringEncoding];
}
//回执
-(void) provideContent:(SKPaymentTransaction *)transaction{
    //UnitySendMessage("IOSIAPMgr", "ProvideContent", [[self transactionInfo:transaction] UTF8String]);
}
 
//沙盒测试环境验证
//#define SANDBOX @"https://sandbox.itunes.apple.com/verifyReceipt"
//#define SANDBOX @"https://test-api-hub.jpsdk.com/bcjtest_new/order/notifyOrderIos"
//正式环境验证
//#define AppStore @"https://buy.itunes.apple.com/verifyReceipt"
//#define AppStore @"https://api-hub.jpsdk.com/bcj/order/notifyOrderIos"

//沙盒测试环境验证
//#define SANDBOX @"https://test-api-hub.jpsdk.com/super_test/order/notifyOrderIos"
//#define SANDBOX @"https://api-hll.jpsdk.com/super/ios/v1-0-1/order/notifyOrderIos"

//正式环境验证
#define SANDBOX @"https://api-hll.jpsdk.com/super/center/order/notifyOrderIos"

/**
 *  验证购买，避免越狱软件模拟苹果请求达到非法购买问题
 *
 */


- (void)verifyPurchaseWithPaymentTransaction {
    // 从沙盒中获取交易凭证并拼接成请求体数据
    NSURL *receiptUrl = [[NSBundle mainBundle] appStoreReceiptURL];
    NSData *receiptData = [NSData dataWithContentsOfURL:receiptUrl];
    NSString *receiptString = [receiptData base64EncodedStringWithOptions:NSDataBase64EncodingEndLineWithLineFeed];
    NSString *bodyString = [NSString stringWithFormat:@"{\"receipt-data\" : \"%@\"}", receiptString];
    NSData *bodyData = [bodyString dataUsingEncoding:NSUTF8StringEncoding];

    // 设置请求URL
    NSURL *url = [NSURL URLWithString:SANDBOX];

    // 创建NSURLSession
    NSURLSession *session = [NSURLSession sharedSession];

    // 创建请求
    NSMutableURLRequest *requestM = [NSMutableURLRequest requestWithURL:url];
    requestM.HTTPBody = bodyData;
    requestM.HTTPMethod = @"POST";

    // 发送异步请求
    NSURLSessionDataTask *task = [session dataTaskWithRequest:requestM completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
        if (error) {
            NSLog(@"验证购买过程中发生错误，错误信息：%@", error.localizedDescription);
            return;
        }

        NSDictionary *dic = [NSJSONSerialization JSONObjectWithData:data options:NSJSONReadingAllowFragments error:nil];
        NSLog(@"苹果商城验证数据 --------------%@", dic);

        // 处理验证结果
        dispatch_async(dispatch_get_main_queue(), ^{
            if ([dic[@"status"] intValue] == 0) {
                NSDictionary *dicReceipt = dic[@"receipt"];
//                NSLog(@"苹果商城验证数据 --------------%@", dicReceipt);
                for (NSDictionary *tmp in dicReceipt[@"in_app"]) {
                    NSString *productIdentifier = tmp[@"product_id"];
                    NSString *transaction_id = tmp[@"transaction_id"];
                    NSLog(@"+++++++++++++++++++++++++++++++++++++%@", transaction_id);
                    NSLog(@"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx%@", self.productIndentify);
                    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
                    if ([productIdentifier isEqualToString:self.productIndentify]) {
                        NSInteger purchasedCount = [defaults integerForKey:productIdentifier];
                        [[NSUserDefaults standardUserDefaults] setInteger:(purchasedCount+1) forKey:productIdentifier];
                        [[IAPInterface sharedSingleton] BuyProcuctSucessCallBack:transaction_id];
                        break;
                    } else {
                        [[NSUserDefaults standardUserDefaults] setBool:YES forKey:productIdentifier];
                        [[IAPInterface sharedSingleton] BuyProcuctSucessCallBack:transaction_id];
                        break;
                    }
                }
            } else {
                NSLog(@"购买失败，未通过验证！");
                [[IAPInterface sharedSingleton] BuyProcuctFailedCallBack:self.productIndentify];
            }
        });
    }];

    // 开始请求
    [task resume];
}
 
//从App Store支付
- (BOOL)paymentQueue:(SKPaymentQueue *)queue shouldAddStorePayment:(SKPayment *)payment forProduct:(SKProduct *)product {
    NSLog(@"从App Store支付");
    //bool _is =  paySuccess;
    //根据product.productIdentifier去判断是否去直接弹出购买弹窗
    if ([product.productIdentifier isEqualToString:@"101"]) {
        return true;
    }
    return false;
}

//监听购买结果
- (void)paymentQueue:(SKPaymentQueue *)queue updatedTransactions:(NSArray *)transaction{
    for(SKPaymentTransaction *tran in transaction){
        switch (tran.transactionState) {
            case SKPaymentTransactionStatePurchased:{
                NSLog(@"交易完成");
                // 发送到苹果服务器验证凭证
                [self verifyPurchaseWithPaymentTransaction];
                [[SKPaymentQueue defaultQueue] finishTransaction:tran];
                
            }
                break;
            case SKPaymentTransactionStatePurchasing:
                NSLog(@"商品添加进列表");
                
                break;
            case SKPaymentTransactionStateRestored:{
                NSLog(@"交易状态恢复");
                [[SKPaymentQueue defaultQueue] finishTransaction:tran];
                }
                break;
            case SKPaymentTransactionStateFailed:{
                NSLog(@"交易取消");
                UIAlertView *mBoxView = [[UIAlertView alloc]
                                         initWithTitle:@"Transaction reminder"
                                         message:@"Transaction failed"
                                         delegate:nil
                                         cancelButtonTitle:nil
                                         otherButtonTitles:@"OK", nil];
                [mBoxView show];
                [[SKPaymentQueue defaultQueue] finishTransaction:tran];
                [[IAPInterface sharedSingleton] BuyProcuctFailedCallBack:self.productIndentify];
                //[[IAPInterface sharedSingleton] test1];
                
            }
                break;
            default:
            {
                [[SKPaymentQueue defaultQueue] finishTransaction:tran];
            }
                break;
        }
    }
}
-(void) completeTransaction:(SKPaymentTransaction *)transaction{
    NSLog(@"Comblete transaction : %@",transaction.transactionIdentifier);
    [self provideContent:transaction];
    [[SKPaymentQueue defaultQueue] finishTransaction:transaction];
}
 
-(void) failedTransaction:(SKPaymentTransaction *)transaction{
    NSLog(@"Failed transaction : %@",transaction.transactionIdentifier);
    
    if (transaction.error.code != SKErrorPaymentCancelled) {
        NSLog(@"!Cancelled");
    }
    [[SKPaymentQueue defaultQueue] finishTransaction:transaction];
}
 
-(void) restoreTransaction:(SKPaymentTransaction *)transaction{
    NSLog(@"Restore transaction : %@",transaction.transactionIdentifier);
    [[SKPaymentQueue defaultQueue] finishTransaction:transaction];
}
 
//已内购的内容，恢复购买时回掉
-(void) paymentQueueRestoreCompletedTransactionsFinished:(SKPaymentQueue *)queue {
    NSLog (@"received restored transactions: %i", queue.transactions.count);

    for (SKPaymentTransaction *transaction in queue.transactions)
    {
        NSString *productID = transaction.payment.productIdentifier;
        NSLog(@"Restore transaction : %@",transaction.payment.productIdentifier);
 
        [[IAPInterface sharedSingleton] RestoreBuyProductSucessCallBack:productID];
    }
}
 
@end
