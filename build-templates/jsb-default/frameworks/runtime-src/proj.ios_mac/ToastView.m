//
//  DesMg.m
//  cocos-mobile
//
//  Created by 1234 on 2025/3/14.
//

#import "ToastView.h"

@implementation ToastView

+ (void)showToastMsg:(NSString *)msg inView:(UIView *)view {
    // 创建一个 Toast 消息视图
    ToastView *toast = [[ToastView alloc] initWithFrame:CGRectZero];
    toast.backgroundColor = [[UIColor blackColor] colorWithAlphaComponent:0.7];
    toast.layer.cornerRadius = 10.0f;
    toast.layer.masksToBounds = YES;
    
    // 设置 Toast 的标签
    UILabel *label = [[UILabel alloc] initWithFrame:CGRectZero];
    label.text = msg;
    label.textColor = [UIColor whiteColor];
    label.font = [UIFont systemFontOfSize:14];
    label.textAlignment = NSTextAlignmentCenter;
    label.numberOfLines = 0;
    [label sizeToFit];
    
    // 设置 padding
    CGFloat padding = 20.0f;

    // 重新计算 Toast 和 label 的尺寸
    CGFloat labelWidth = label.frame.size.width + padding * 2;
    CGFloat labelHeight = label.frame.size.height + padding * 2;
    
    // 如果 label 的宽度小于 Toast 的最小宽度，设置最小宽度
    CGFloat minWidth = 120.0f;
    labelWidth = MAX(labelWidth, minWidth);
    
    // 设置 Toast 的尺寸
    toast.frame = CGRectMake(0, 0, labelWidth, labelHeight);
    label.frame = CGRectMake(padding, padding, toast.frame.size.width - padding * 2, toast.frame.size.height - padding * 2);
    [toast addSubview:label];
    
    // 设置 Toast 居中显示的位置
    toast.center = CGPointMake(view.frame.size.width / 2, view.frame.size.height / 2);
    
    // 将 Toast 添加到父视图
    [view addSubview:toast];
    
    // 动画显示 Toast
    toast.alpha = 0;
    [UIView animateWithDuration:0.3 animations:^{
        toast.alpha = 1.0;
    } completion:^(BOOL finished) {
        // 延迟一段时间后隐藏 Toast
        [UIView animateWithDuration:0.3 delay:2.0 options:UIViewAnimationOptionCurveEaseInOut animations:^{
            toast.alpha = 0;
        } completion:^(BOOL finished) {
            [toast removeFromSuperview];
        }];
    }];
}


@end
