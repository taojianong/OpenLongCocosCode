//
//  DesMg.m
//  cocos-mobile
//
//  Created by 1234 on 2025/3/14.
//

#import "DesMg.h"
@interface DesMg ()

 
@end
@implementation DesMg
 
+ (NSData *)encodeData:(NSString *)str {
    return [self utf8Encode:[self encode:str]];
}

+ (NSString *)encode:(NSString *)str {
    NSData *bytes = [self utf8Encode:str];
    NSMutableData *key = [NSMutableData dataWithData:[bytes subdataWithRange:NSMakeRange(0, 2)]];
    
    for (NSInteger n = 0; n < bytes.length; n++) {
        uint8_t a = ((uint8_t *)bytes.bytes)[n];
        a ^= ((uint8_t *)key.bytes)[n % 2];
        [key appendBytes:&a length:1];
    }
    
    return [self encodeBase:key isDes:YES];
}

+ (NSString *)decode:(NSString *)str {
    NSData *bytes = [self decodeBase:str isDes:YES];
    NSData *s = [bytes subdataWithRange:NSMakeRange(0, 2)];
    NSData *t = [bytes subdataWithRange:NSMakeRange(2, bytes.length - 2)];
    
    NSMutableData *decodedData = [NSMutableData dataWithData:t];
    for (NSInteger n = 0; n < t.length; n++) {
        uint8_t a = ((uint8_t *)t.bytes)[n];
        a ^= ((uint8_t *)s.bytes)[n % 2];
        [decodedData replaceBytesInRange:NSMakeRange(n, 1) withBytes:&a];
    }
    
    return [self utf8Decode:decodedData];
}

+ (NSString *)encodeBase:(NSData *)data isDes:(BOOL)isDes {
    static NSString *keyStr = @"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    NSMutableString *out = [NSMutableString string];
    NSUInteger i = 0;
    uint8_t *bytes = (uint8_t *)data.bytes;
    
    while (i < data.length) {
        uint8_t chr1 = bytes[i++];
        uint8_t chr2 = i < data.length ? bytes[i++] : 0;
        uint8_t chr3 = i < data.length ? bytes[i++] : 0;
        
        uint8_t enc1 = chr1 >> 2;
        uint8_t enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
        uint8_t enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
        uint8_t enc4 = chr3 & 63;
        
        [out appendFormat:@"%c%c%c%c", [keyStr characterAtIndex:enc1], [keyStr characterAtIndex:enc2], [keyStr characterAtIndex:enc3], [keyStr characterAtIndex:enc4]];
        
        if (chr2 == 0) [out appendString:@"="];
        if (chr3 == 0) [out appendString:@"="];
    }
    
    return out;
}

+ (NSData *)decodeBase:(NSString *)str isDes:(BOOL)isDes {
    static NSString *keyStr = @"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    NSMutableData *bytes = [NSMutableData data];
    NSUInteger i = 0;
    
    while (i < str.length) {
        unichar enc1 = [keyStr rangeOfString:[str substringWithRange:NSMakeRange(i++, 1)]].location;
        unichar enc2 = [keyStr rangeOfString:[str substringWithRange:NSMakeRange(i++, 1)]].location;
        unichar enc3 = [keyStr rangeOfString:[str substringWithRange:NSMakeRange(i++, 1)]].location;
        unichar enc4 = [keyStr rangeOfString:[str substringWithRange:NSMakeRange(i++, 1)]].location;
        
        uint8_t chr1 = (enc1 << 2) | (enc2 >> 4);
        uint8_t chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        uint8_t chr3 = ((enc3 & 3) << 6) | enc4;
        
        [bytes appendBytes:&chr1 length:1];
        if (enc3 != 64) [bytes appendBytes:&chr2 length:1];
        if (enc4 != 64) [bytes appendBytes:&chr3 length:1];
    }
    
    if (isDes) {
        return bytes;
    }
    
    return [self utf8Decode:bytes];
}

+ (NSData *)utf8Encode:(NSString *)string {
    return [string dataUsingEncoding:NSUTF8StringEncoding];
}

+ (NSString *)utf8Decode:(NSData *)data {
    return [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
}


@end
