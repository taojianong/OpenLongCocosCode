/****************************************************************************
 Copyright (c) 2017-2018 Xiamen Yaji Software Co., Ltd.

 http://www.cocos.com

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated engine source code (the "Software"), a limited,
 worldwide, royalty-free, non-assignable, revocable and non-exclusive license
 to use Cocos Creator solely to develop games on your target platforms. You shall
 not use Cocos Creator software for developing other software or tools that's
 used for developing games. You are not granted to publish, distribute,
 sublicense, and/or sell copies of Cocos Creator.

 The software or tools in this License Agreement are licensed, not sold.
 Xiamen Yaji Software Co., Ltd. reserves all rights not expressly granted to you.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/

#include "AppDelegate.h"

#include "cocos2d.h"

#include "cocos/scripting/js-bindings/manual/jsb_module_register.hpp"
#include "cocos/scripting/js-bindings/manual/jsb_global.h"
#include "cocos/scripting/js-bindings/jswrapper/SeApi.h"
#include "cocos/scripting/js-bindings/event/EventDispatcher.h"
#include "cocos/scripting/js-bindings/manual/jsb_classtype.hpp"

USING_NS_CC;

AppDelegate::AppDelegate(int width, int height) : Application("Cocos Game", width, height)
{
}

AppDelegate::~AppDelegate()
{
}

inline std::string xor_encrypt_decrypt(const std::vector<char> &input, char key) {
    std::string output;
    output.reserve(input.size());  // 预先分配内存
    for (auto ch : input) {
        output.push_back(ch ^ key);
    }
    return output;
}

bool AppDelegate::applicationDidFinishLaunching()
{
    se::ScriptEngine* se = se::ScriptEngine::getInstance();
    std::vector<char> part1 = { 56, 51, 50, 115, 45, 37, 114 };
    std::vector<char> part2 = { 114, 102, 121, 123, 121, 127, 102, 125, 126 };
    // 将两个部分拷贝到同一个 vector 中
    std::vector<char> encryptedPassword;
    encryptedPassword.reserve(sizeof(part1) + sizeof(part2)); // 预先分配内存
    encryptedPassword.insert(encryptedPassword.end(), std::begin(part1), std::end(part1));
    encryptedPassword.insert(encryptedPassword.end(), std::begin(part2), std::end(part2));
    char xor_key = 'K';
    std::string password = xor_encrypt_decrypt(encryptedPassword, xor_key);
        //jsb _set _xxtea _key(password.c_str());
    //jsb_set_xxxxtea_key(password.c_str());
    jsb_init_file_operation_delegate();

#if defined(COCOS2D_DEBUG) && (COCOS2D_DEBUG > 0)
    // Enable debugger here
    jsb_enable_debugger("0.0.0.0", 6086, false);
#endif

    se->setExceptionCallback([](const char* location, const char* message, const char* stack){
        // Send exception information to server like Tencent Bugly.
        cocos2d::log("\nUncaught Exception:\n - location :  %s\n - msg : %s\n - detail : \n      %s\n", location, message, stack);
		#if CC_TARGET_PLATFORM == CC_PLATFORM_ANDROID
            JniHelper::callStaticVoidMethod("org/cocos2dx/javascript/AppActivity", "SendExceptionToSDK", location, message, stack);
        #endif
    });

    jsb_register_all_modules();

    se->start();

    se::AutoHandleScope hs;
    jsb_run_script("jsb-adapter/jsb-builtin.js");
    jsb_run_script("main.js");

    se->addAfterCleanupHook([](){
        JSBClassType::destroy();
    });

    return true;
}

// This function will be called when the app is inactive. When comes a phone call,it's be invoked too
void AppDelegate::onPause()
{
    EventDispatcher::dispatchOnPauseEvent();
}

// this function will be called when the app is active again
void AppDelegate::onResume()
{
    EventDispatcher::dispatchOnResumeEvent();
}
