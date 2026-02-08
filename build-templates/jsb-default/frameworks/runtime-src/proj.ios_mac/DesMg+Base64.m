//
//  DesMg+Base64.m
//  cocos-mobile
//
//  Created by 1234 on 2025/3/14.
//

#import "DesMg+Base64.h"

@implementation DesMg (Base64)
+ (NSString *)encodeBase64:(NSData *)data isDes:(BOOL)isDes {
    return [data base64EncodedStringWithOptions:0];
}

+ (NSData *)decodeBase64:(NSString *)string isDes:(BOOL)isDes {
    return [[NSData alloc] initWithBase64EncodedString:string options:0];
}
@end
