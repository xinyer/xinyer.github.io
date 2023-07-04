- [1. 如何进入模拟器的工程模式？](#1-如何进入模拟器的工程模式)
- [2. 工程模式中有很多测试入口，打开不同测试入口之后的功能由各个模块的应用实现，工程模式应用如何自动发现这些入口？](#2-工程模式中有很多测试入口打开不同测试入口之后的功能由各个模块的应用实现工程模式应用如何自动发现这些入口)


## 1. 如何进入模拟器的工程模式？

拨号键盘 *#*#4636#*#*

中间的数字有很多种，可以进入不同的测试功能

![emulatot factory mode](/assets/images/emulator_factory_mode.png)

## 2. 工程模式中有很多测试入口，打开不同测试入口之后的功能由各个模块的应用实现，工程模式应用如何自动发现这些入口？
- 其他应用可以在 AndroidManifest.xml 文件中，添加自定义 action，比如 `<action android:name="com.example.settings.ACTION_REGISTER_TESTING_PAGE" />`

    ```xml
    <?xml version="1.0" encoding="utf-8"?>
    <manifest>
        ...
        <application>
            ...
            <activity
                android:name=".MainActivity"
                android:exported="true"
                android:label="@string/app_name">
                
                <intent-filter>
                    <action android:name="com.example.settings.ACTION_REGISTER_TESTING_PAGE" />
                    <category android:name="android.intent.category.DEFAULT" />
                </intent-filter>
            </activity>
            ...
        </application>

    </manifest>
    ```
    在这里需要定义 name，label，exported="true"
- 在工程模式应用中可以调用 `packageManager.queryIntentActivities()` 获取到 Activity 信息
    ```kotlin
    private fun discoverPages() {
        val intent = Intent("com.example.settings.ACTION_REGISTER_TESTING_PAGE")
        val resolveInfoList = packageManager.queryIntentActivities(
            intent,
            PackageManager.ResolveInfoFlags.of(PackageManager.GET_RESOLVED_FILTER.toLong())
        )
        for (resolveInfo in resolveInfoList) {
            val activityInfo = resolveInfo.activityInfo
            val packageName = activityInfo.packageName
            val className = activityInfo.name
            val pageTitle = activityInfo.loadLabel(packageManager).toString()
            ...
        }
    }
    ```

