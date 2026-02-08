#import <Foundation/Foundation.h>
//#import <BUAdSDK/BUAdSDK.h>
#import <UIKit/UIKit.h>


@interface DeviceUtil : NSObject

+ (UIViewController *)theTopviewControler;
NSString *getDeviceIdentifier();
+ (void)clearAllCaches:(NSString *)p;
- (void)initAd;
+ (void)getDeviceIDFV :(NSString *)p;
+ (void)showRewardVideoAd :(NSString *)p;
+ (void)initAlicomSDK:(NSString *)p;
+ (void)showUI:(NSString *)p;

+ (void)userLogin:(NSString *)userData;

+ (void)loadAd;

+ (void)yonghu:(NSString *)p;

+ (void)yingsi:(NSString *)p;

+ (void)gailv:(NSString *)p;
+ (void)copyTextToClipboard:(NSString *)text;

+ (void)exitApp:(NSString *)p;

+ (void)save:(NSString*)service data:(id)data;
+ (id)load:(NSString*)service;
+ (void)deleteKeyData:(NSString*)service;

+ (NSString *)getUUIDByKeyChain;

+ (NSString *)getSystemInfo:(NSString *)p;

+ (void)openService:(NSString *)data;

@end

