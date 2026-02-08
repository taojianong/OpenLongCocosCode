//
//  LQAppleLogin.h
//  LQAppleLogin
//
//  Created by
//  Copyright © 2019 Q.ice. All rights reserved.
//
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN
typedef void(^LQAppleLoginCompleteHandler)(BOOL successed,NSString * _Nullable user, NSString *_Nullable familyName, NSString *_Nullable givenName, NSString *_Nullable email,NSString *_Nullable password, NSData *_Nullable identityToken, NSData *_Nullable authorizationCode, NSError *_Nullable error, NSString * msg);

typedef void(^LQAppleLoginObserverHandler)(void);
@interface LQAppleLogin : NSObject

+ (instancetype) shared ;

+ (UIView *) creatAppleIDAuthorizedButtonWithTarget:(id)target selector:(SEL)selector ;

+ (void) checkAuthorizationStateWithUser:(NSString *) user
                         completeHandler:(void(^)(BOOL authorized, NSString *msg)) completeHandler ;

- (void) loginWithExistingAccount:(LQAppleLoginCompleteHandler)completeHandler ;

- (void) loginWithCompleteHandler:(LQAppleLoginCompleteHandler)completeHandler ;

- (void) startAppleIDObserverWithCompleteHandler:(LQAppleLoginObserverHandler) handler ;

BOOL isTokenExpired(NSString *jwtToken);
@end

NS_ASSUME_NONNULL_END
