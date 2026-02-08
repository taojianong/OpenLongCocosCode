//
//  LoginViewController.m
//  cocos-mobile
//
//  Created by 1234 on 2025/3/14.
//

#import "AccountViewController.h"

@interface AccountViewController ()
@property (retain, nonatomic) IBOutlet UIView *mainView;
@property (retain, nonatomic) IBOutlet UIView *view1;
@property (retain, nonatomic) IBOutlet UIView *view2;
@property (retain, nonatomic) IBOutlet UIView *view3;
@property (retain, nonatomic) IBOutlet UIView *view4;
@property (retain, nonatomic) IBOutlet UIView *view5;
@property (retain, nonatomic) IBOutlet UIView *view6;

@end

@implementation AccountViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    // Do any additional setup after loading the view from its nib.
    self.mainView.layer.cornerRadius = 10;
    self.mainView.clipsToBounds = YES;
    self.view1.layer.cornerRadius = 10;
    self.view1.clipsToBounds = YES;
    self.view3.layer.cornerRadius = 10;
    self.view3.clipsToBounds = YES;
    self.view2.layer.cornerRadius = 10;
    self.view2.clipsToBounds = YES;
    self.view4.layer.cornerRadius = 10;
    self.view4.clipsToBounds = YES;
    self.view5.layer.cornerRadius = 10;
    self.view5.clipsToBounds = YES;
    self.view6.layer.cornerRadius = 10;
    self.view6.clipsToBounds = YES;
    
    self.view1.layer.borderColor = [UIColor colorWithRed:0.82 green:0.82  blue:0.82 alpha:1.0].CGColor;
    self.view1.layer.borderWidth = 1;
    
    self.view2.layer.borderColor = [UIColor colorWithRed:0.82 green:0.82  blue:0.82 alpha:1.0].CGColor;
    self.view2.layer.borderWidth = 1;
    
    self.view3.layer.borderColor = [UIColor colorWithRed:0.82 green:0.82  blue:0.82 alpha:1.0].CGColor;
    self.view3.layer.borderWidth = 1;
    
    self.view4.layer.borderColor = [UIColor colorWithRed:0.82 green:0.82  blue:0.82 alpha:1.0].CGColor;
    self.view4.layer.borderWidth = 1;
    
    self.view5.layer.borderColor = [UIColor colorWithRed:0.82 green:0.82  blue:0.82 alpha:1.0].CGColor;
    self.view5.layer.borderWidth = 1;
    
    self.view6.layer.borderColor = [UIColor colorWithRed:0.82 green:0.82  blue:0.82 alpha:1.0].CGColor;
    self.view6.layer.borderWidth = 1;
}

//返回
- (IBAction)back:(id)sender {
    NSLog(@"点击返回");
}

- (IBAction)actions:(UIButton *)sender {
    NSInteger tag = sender.tag;
    switch (tag) {
        case 0:
            NSLog(@"绑定账号");
            break;
        case 1:
            NSLog(@"实名认证");
            break;
        case 2:
            NSLog(@"切换账号");
            break;
        case 3:
            NSLog(@"隐私政策");
            break;
        case 4:
            NSLog(@"用户协议");
            break;
        case 5:
            NSLog(@"联系客服");
            break;
            
        default:
            break;
    }
}

- (void)dealloc {
    [_mainView release];
    [_view1 release];
    [_view2 release];
    [_view3 release];
    [_view4 release];
    [_view5 release];
    [_view6 release];
    [super dealloc];
}
@end
