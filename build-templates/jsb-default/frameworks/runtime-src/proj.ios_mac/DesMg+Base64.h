//
//  DesMg+Base64.h
//  cocos-mobile。
//  和js端加密解密对不上，先不用了
//  Created by 1234 on 2025/3/14.
//

#import "DesMg.h"

NS_ASSUME_NONNULL_BEGIN

@interface DesMg (Base64)
+ (NSString *)encodeBase64:(NSData *)data isDes:(BOOL)isDes;
+ (NSData *)decodeBase64:(NSString *)string isDes:(BOOL)isDes;
@end

NS_ASSUME_NONNULL_END
