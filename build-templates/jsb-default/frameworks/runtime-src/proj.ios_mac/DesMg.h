//
//  DesMg.h
//  cocos-mobile
//
//  Created by 1234 on 2025/3/14.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface DesMg : NSObject
+ (NSString *)encode:(NSString *)str;
+ (NSData *)encodeData:(NSString *)str;
+ (NSString *)decode:(NSString *)str;
 
@end

NS_ASSUME_NONNULL_END
