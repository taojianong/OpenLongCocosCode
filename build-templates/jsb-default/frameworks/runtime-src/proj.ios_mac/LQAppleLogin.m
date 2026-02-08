//
//  LQAppleLogin.m
//  LQAppleLogin
//
//  Created by
//  Copyright © 2019 Q.ice. All rights reserved.
//
 
#import "LQAppleLogin.h"
#import <AuthenticationServices/AuthenticationServices.h>
#import "IAPInterface.h"
 
@interface LQAppleLogin ()<ASAuthorizationControllerDelegate, ASAuthorizationControllerPresentationContextProviding>
 
@property (nonatomic, copy) LQAppleLoginCompleteHandler completeHander;
@property (nonatomic, copy) LQAppleLoginObserverHandler observerHander;
 
+ (instancetype) shared;
 
@end
@implementation LQAppleLogin
 
+ (instancetype) shared {
    
    static dispatch_once_t onceToken;
    static LQAppleLogin *ZY_instanceShard ;
    dispatch_once(&onceToken, ^{
        ZY_instanceShard = [[LQAppleLogin alloc]init];
    });
    
    return ZY_instanceShard;
}
 
+ (UIView *) creatAppleIDAuthorizedButtonWithTarget:(id)target selector:(SEL)selector {
    
    ASAuthorizationAppleIDButton *button = [ASAuthorizationAppleIDButton buttonWithType:(ASAuthorizationAppleIDButtonTypeSignIn) style:(ASAuthorizationAppleIDButtonStyleBlack)];
    [button addTarget:target action:selector forControlEvents:(UIControlEventTouchUpInside)];
    
    return button;
}
 
+ (void) checkAuthorizationStateWithUser:(NSString *) user
                         completeHandler:(void(^)(BOOL authorized, NSString *msg)) completeHandler {
    
    if (user == nil || user.length <= 0) {
        if (completeHandler) {
            completeHandler(NO, @"用户标识符错误");
        }
        return;
    }
    
    ASAuthorizationAppleIDProvider *provider = [[ASAuthorizationAppleIDProvider alloc]init];
    [provider getCredentialStateForUserID:user completion:^(ASAuthorizationAppleIDProviderCredentialState credentialState, NSError * _Nullable error) {
        LQAppleLogin *loginManager = [[LQAppleLogin alloc] init];
        NSString *msg = @"未知";
        BOOL authorized = NO;
        switch (credentialState) {
            case ASAuthorizationAppleIDProviderCredentialRevoked:
                msg = @"授权被撤销";
                authorized = NO;
                break;
            case ASAuthorizationAppleIDProviderCredentialAuthorized:
                msg = @"已授权";
                authorized = YES;
                break;
            case ASAuthorizationAppleIDProviderCredentialNotFound:
                msg = @"未查到授权信息";
                authorized = NO;
                break;
            case ASAuthorizationAppleIDProviderCredentialTransferred:
                msg = @"授权信息变动";
                authorized = NO;
                break;
                
            default:
                authorized = NO;
                break;
        }
        
        if (completeHandler) {
            completeHandler(authorized, msg);
        }
    }];
}


- (void) startAppleIDObserverWithCompleteHandler:(LQAppleLoginObserverHandler) handler {
    
    self.observerHander = handler;
    
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(lq_signWithAppleIDStateChanged:) name:ASAuthorizationAppleIDProviderCredentialRevokedNotification object:nil];
}
 
- (void) lq_signWithAppleIDStateChanged:(NSNotification *) noti {
 
    if (noti.name == ASAuthorizationAppleIDProviderCredentialRevokedNotification) {
        if (self.observerHander) {
            self.observerHander();
        }
    }
}
 
- (void) loginWithExistingAccount:(LQAppleLoginCompleteHandler)completeHandler {
    
    self.completeHander = completeHandler;
    
    ASAuthorizationAppleIDProvider *provider = [[ASAuthorizationAppleIDProvider alloc]init];
    
    ASAuthorizationAppleIDRequest *req = [provider createRequest];
    ASAuthorizationPasswordProvider *pasProvider = [[ASAuthorizationPasswordProvider alloc]init];
    ASAuthorizationPasswordRequest *pasReq = [pasProvider createRequest];
    NSMutableArray *arr = [NSMutableArray arrayWithCapacity:2];
    if (req) {
        [arr addObject:req];
    }
    
    if (pasReq) {
        [arr addObject:pasReq];
    }
    
    ASAuthorizationController *controller = [[ASAuthorizationController alloc]initWithAuthorizationRequests:arr.copy];
    
    controller.delegate = self;
    controller.presentationContextProvider = self;
    [controller performRequests];

}
 
- (void) loginWithCompleteHandler:(LQAppleLoginCompleteHandler)completeHandler {
    
    self.completeHander = completeHandler;
    
    ASAuthorizationAppleIDProvider *provider = [[ASAuthorizationAppleIDProvider alloc]init];
    
    ASAuthorizationAppleIDRequest *req = [provider createRequest];
    req.requestedScopes = @[ASAuthorizationScopeFullName, ASAuthorizationScopeEmail];
    
    ASAuthorizationController *controller = [[ASAuthorizationController alloc]initWithAuthorizationRequests:@[req]];
    controller.delegate = self;
    controller.presentationContextProvider = self;
    
    [controller performRequests];
}
 
// 授权失败的回调
- (void)authorizationController:(ASAuthorizationController *)controller didCompleteWithError:(NSError *)error {
 
    NSString *msg = @"未知";
    
    switch (error.code) {
        case ASAuthorizationErrorCanceled:
            msg = @"用户取消";
            break;
        case ASAuthorizationErrorFailed:
            msg = @"授权请求失败";
            break;
        case ASAuthorizationErrorInvalidResponse:
            msg = @"授权请求无响应";
            break;
        case ASAuthorizationErrorNotHandled:
            msg = @"授权请求未处理";
            break;
        case ASAuthorizationErrorUnknown:
            msg = @"授权失败，原因未知";
            break;
            
        default:
            break;
    }
    
    if (self.completeHander) {
        self.completeHander(NO, nil, nil, nil, nil, nil, nil, nil, error, msg);
    }
}

// 授权成功的回调
- (void)authorizationController:(ASAuthorizationController *)controller didCompleteWithAuthorization:(ASAuthorization *)authorization {
    
    if ([authorization.credential isKindOfClass:[ASAuthorizationAppleIDCredential class]]) {
        ASAuthorizationAppleIDCredential *credential = authorization.credential;
        NSString *user = credential.user;
        
        NSString *familyName = credential.fullName.familyName;
        NSString * givenName = credential.fullName.givenName;
        NSString *email = credential.email;
        
        NSData *identityToken = credential.identityToken;
        NSData *code = credential.authorizationCode;
        
        NSString*strToken =[[NSString alloc] initWithData:identityToken  encoding:NSUTF8StringEncoding];
        // 保存用户登录状态信息
        [[NSUserDefaults standardUserDefaults] setObject:user forKey:@"userId"];
        [[NSUserDefaults standardUserDefaults] setObject:strToken forKey:@"strToken"];
        NSLog(@"----授权成功的回调----");
//        [[IAPInterface sharedSingleton] test1:user withString:strToken];
        if (self.completeHander) {
            self.completeHander(YES, user, familyName, givenName, email, nil, identityToken, code, nil, @"授权成功");
        }
        
        
    } else if ([authorization.credential isKindOfClass:[ASPasswordCredential class]]) {
        // 使用现有的密码凭证登录
        ASPasswordCredential *credential = authorization.credential;
        
        // 用户唯一标识符
        NSString *user = credential.user;
        NSString *password = credential.password;
        
        if (self.completeHander) {
            self.completeHander(YES, user, nil, nil, nil, password, nil, nil, nil, @"授权成功");
        }
    }
}

//-------------------

// 解析 JWT 并检查是否过期
BOOL isTokenExpired(NSString *jwtToken) {
    // 分割 JWT 为三部分
    NSArray *tokenComponents = [jwtToken componentsSeparatedByString:@"."];
    
    if (tokenComponents.count != 3) {
        // 如果 JWT 结构不合法，返回过期
        return YES;
    }

    // 获取 Payload 部分
    NSString *payloadBase64 = tokenComponents[1];
    
    // 替换 Base64 URL 编码为标准 Base64 编码
    payloadBase64 = [payloadBase64 stringByReplacingOccurrencesOfString:@"-" withString:@"+"];
    payloadBase64 = [payloadBase64 stringByReplacingOccurrencesOfString:@"_" withString:@"/"];
    
    // 补充 `=` 以保证长度是 4 的倍数
    NSInteger paddingLength = payloadBase64.length % 4;
    if (paddingLength > 0) {
        payloadBase64 = [payloadBase64 stringByPaddingToLength:payloadBase64.length + (4 - paddingLength) withString:@"=" startingAtIndex:0];
    }

    // 解码 Base64 字符串
    NSData *payloadData = [[NSData alloc] initWithBase64EncodedString:payloadBase64 options:0];
    
    if (!payloadData) {
        // 如果解码失败，返回过期
        return YES;
    }
    
    // 将 Payload 部分转换为字典
    NSError *error = nil;
    NSDictionary *payloadDict = [NSJSONSerialization JSONObjectWithData:payloadData options:0 error:&error];
    
    if (error || !payloadDict) {
        // 如果解析失败，返回过期
        return YES;
    }
    
    // 获取有效期字段
    NSNumber *expNumber = payloadDict[@"exp"];
    if (!expNumber) {
        // 如果没有找到有效期字段，返回过期
        return YES;
    }

    // 提取有效期时间戳
    NSTimeInterval expirationTime = [expNumber doubleValue];
    
    // 获取当前时间的时间戳
    NSTimeInterval currentTime = [[NSDate date] timeIntervalSince1970];
    
    // 检查有效期是否过期
    BOOL isExpired = expirationTime < currentTime;

    return isExpired;
}

//-------
 
- (ASPresentationAnchor)presentationAnchorForAuthorizationController:(ASAuthorizationController *)controller {
    return [UIApplication sharedApplication].windows.firstObject;
}
 
 
@end
