//
//  AppDelegate.m
//  SimpleProject
//
//  Created by PonyCui on 2018/10/26.
//  Copyright © 2018年 XTStudio. All rights reserved.
//

#import "AppDelegate.h"
#import <Endo/Endo.h>
#import <Kimi-iOS-SDK/KIMIDebugger.h>

@interface AppDelegate ()

@property (nonatomic, strong) JSContext *mainContext;
@property (nonatomic, strong) KIMIDebugger *debugger;

@end

@implementation AppDelegate


- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
    self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
    self.window.rootViewController = [UIViewController new];
    [self.window makeKeyAndVisible];
    [self setupDebugger];
    return YES;
}

- (void )setupDebugger {
    self.debugger = [[KIMIDebugger alloc] initWithRemoteAddress:nil];
    [self.debugger connect:^(JSContext *mainContext) {
        self.mainContext = mainContext;
        UIViewController *mainViewController = [[EDOExporter sharedExporter]
                                                nsValueWithJSValue:self.mainContext[@"main"]];
        self.window.rootViewController = mainViewController;
    } fallback:^{
        [self setupContext];
    }];
}

- (void)setupContext {
    self.mainContext = [[JSContext alloc] init];
    [[EDOExporter sharedExporter] exportWithContext:self.mainContext];
    
    [self.mainContext evaluateScript:
     [NSString stringWithContentsOfFile:[[NSBundle mainBundle] pathForResource:@"app"
                                                                        ofType:@"js"]
                               encoding:NSUTF8StringEncoding
                                  error:NULL]];
    UIViewController *mainViewController = [[EDOExporter sharedExporter]
                                            nsValueWithJSValue:self.mainContext[@"main"]];
    self.window.rootViewController = mainViewController;
}

@end
