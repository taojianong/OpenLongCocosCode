//
//  LoginViewController.m
//  cocos-mobile
//
//  Created by 1234 on 2025/3/14.
//

#import "LoginViewController.h"
#import "AlicomFusionManager.h"
#import "DesMg.h"

@interface LoginViewController ()

@property (retain, nonatomic) IBOutlet UIView *loginView;
@property (retain, nonatomic) IBOutlet UITextField *phoneTextField;
@property (retain, nonatomic) IBOutlet UITextField *codeTextField;
@property (retain, nonatomic) IBOutlet UIButton *codeButton;
@property (retain, nonatomic) IBOutlet UIButton *loginButton;
@property (retain, nonatomic) IBOutlet UIButton *otherLoginButton;
@property (assign, nonatomic) int countdownTime;
@property (retain, nonatomic) dispatch_source_t countdownTimer;
@end

@implementation LoginViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    // Do any additional setup after loading the view from its nib.
    self.countdownTime = 60;
    
    self.loginView.layer.cornerRadius = 10;
    self.codeButton.layer.cornerRadius = 19;
    self.codeButton.clipsToBounds = YES;
    self.codeButton.layer.borderColor = [UIColor colorWithRed:0.93 green:0.48  blue:0.55 alpha:1.0].CGColor;
    self.codeButton.layer.borderWidth = 1;
    
    self.loginButton.layer.cornerRadius = 25;
    self.loginButton.clipsToBounds = YES;
    
    [self getConfig];
}




- (void)getConfig{
    // 1. 创建 URL 对象
        NSString *urlString = @"https://api-hll.jpsdk.com/super/ios/v1-0-1/user/dypns_token";
        NSURL *url = [NSURL URLWithString:urlString];


        // 2. 创建 POST 请求
        NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:url];
        [request setHTTPMethod:@"POST"];


        // 3. 设置 JSON 请求头
        [request setValue:@"application/json" forHTTPHeaderField:@"Content-Type"];
        [request setValue:@"keep-alive" forHTTPHeaderField:@"Connection"]; // 添加 keep-alive 头部


        NSDictionary *params = @{
            @"platform": @"iOS",
            };
        // 1. 序列化 JSON
//        NSError *jsonError;
//        NSData *bodyData = [NSJSONSerialization dataWithJSONObject:params
//                                                          options:0
//                                                            error:&jsonError];
//        if (jsonError) {
//            NSLog(@"JSON 序列化失败: %@", jsonError.localizedDescription);
//            return;
//        }


        // 2. 转换为 UTF-8 字符串
//        NSString *jsonString = [[NSString alloc] initWithData:bodyData
//                                                    encoding:NSUTF8StringEncoding];
//        if (!jsonString) {
//            NSLog(@"Data 转 String 失败");
//            return;
//        }


        // 3. 执行加密（使用工具类方法）
        NSString *encryptedStr = @"eyIAAAtOGlYdTQlPWRhZSzRxWV8=";//[self encode:jsonString];
        NSLog(@"加密结果: %@", encryptedStr); // 示例输出：KwYgVw0gVwYhIw==


        // 4. 如需 NSData 格式可再转换
        NSData *encryptedData = [encryptedStr dataUsingEncoding:NSUTF8StringEncoding];




        if (!encryptedData) {
            NSLog(@"加密失败");
            return;
        }


        // 设置加密后的请求体
        [request setHTTPBody:encryptedData];


        // 6. 打印加密后的请求体内容（调试用）
        NSString *encryptedRequestBody = [[NSString alloc] initWithData:encryptedData encoding:NSUTF8StringEncoding];
        NSLog(@"加密后的请求体: %@", encryptedRequestBody);


        // 7. 发送请求
        NSURLSession *session = [NSURLSession sharedSession];
        [[session dataTaskWithRequest:request completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
            if (error) {
                NSLog(@"请求失败: %@", error.localizedDescription);
            } else {
                NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)response;
                NSLog(@"状态码: %ld", (long)httpResponse.statusCode);


                NSString *responseString = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
    //            NSLog(@"响应内容: %@", responseString);
                NSString *outputString = [responseString length] > 1000 ? [responseString substringToIndex:1000] : responseString;
                NSLog(@"响应内容1: %@", outputString);


                // 处理响应中的 JSON 数据
                //需要解密
                NSError *jsonParseError;
                NSDictionary *responseDict = [NSJSONSerialization JSONObjectWithData:data options:0 error:&jsonParseError];
                if (jsonParseError) {
                    NSLog(@"JSON 解析失败: %@", jsonParseError.localizedDescription);
                } else {
                    NSLog(@"响应 JSON: %@", responseDict);
                }
            }
        }] resume];
}

NSString *removeEscapeCharacters(NSString *jsonString) {
    // 将 JSON 字符串转换为 NSData
    NSData *data = [jsonString dataUsingEncoding:NSUTF8StringEncoding];
    
    // 使用 NSJSONSerialization 解析 NSData
    NSError *error = nil;
    id jsonObject = [NSJSONSerialization JSONObjectWithData:data options:0 error:&error];
    
    if (error) {
        NSLog(@"解析 JSON 时发生错误: %@", error.localizedDescription);
        return nil;
    }
    
    // 将解析后的对象重新转换为 JSON 字符串
    NSData *newData = [NSJSONSerialization dataWithJSONObject:jsonObject options:0 error:&error];
    
    if (error) {
        NSLog(@"重新转换 JSON 时发生错误: %@", error.localizedDescription);
        return nil;
    }
    
    // 将 NSData 转换为字符串，并返回结果
    NSString *newJsonString = [[NSString alloc] initWithData:newData encoding:NSUTF8StringEncoding];
    
    return newJsonString;
}

- (IBAction)resKeyborad:(id)sender {
    [self.phoneTextField resignFirstResponder];
    [self.codeTextField resignFirstResponder];
}
//登录
- (IBAction)login:(id)sender {
    NSLog(@"点击登录");
    [self getConfig];
}


//客服
- (IBAction)customer:(id)sender {
    NSLog(@"点击客服");
}

//返回
- (IBAction)back:(id)sender {
    NSLog(@"点击返回");
    // 假设你想切换到一个新的视图控制器，叫做 homeVC


}

//游客登录
- (IBAction)touristLogin:(id)sender {
    NSLog(@"点击游客登录");
}

//密码登录
- (IBAction)accountLogin:(id)sender {
    NSLog(@"点击密码登录");
}

///获取验证码
- (IBAction)getMsgCode:(id)sender {
    self.codeButton.enabled = NO;
    _countdownTimer = dispatch_source_create(DISPATCH_SOURCE_TYPE_TIMER, 0, 0, dispatch_get_main_queue());
    dispatch_source_set_timer(_countdownTimer, DISPATCH_TIME_NOW, 1.0 * NSEC_PER_SEC, 0.1 * NSEC_PER_SEC); // 每秒触发一次
    dispatch_source_set_event_handler(_countdownTimer, ^{
        if (self.countdownTime > 0) {
            self.countdownTime--;
            dispatch_async(dispatch_get_main_queue(), ^{
                [self.codeButton setTitle:[NSString stringWithFormat:@"%ds",self.countdownTime] forState:UIControlStateNormal];
            });
        } else {
            dispatch_source_cancel(_countdownTimer);
            _countdownTimer = nil;
            dispatch_async(dispatch_get_main_queue(), ^{
                [self.codeButton setTitle:@"获取验证码" forState:UIControlStateNormal];
            });
        }
    });
    dispatch_resume(_countdownTimer);
}
//用户协议
- (IBAction)userAgreement:(id)sender {
    NSLog(@"用户协议");
    
}
//隐私协议
- (IBAction)privacyAgreement:(id)sender {
    NSLog(@"隐私协议");
}

- (void)dealloc {
    [_countdownTimer release];
    [_loginView release];
    [_phoneTextField release];
    [_codeTextField release];
    [_codeButton release];
    [_loginButton release];
    [_otherLoginButton release];
    [super dealloc];
}
@end
