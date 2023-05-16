---
layout: default
title: 如何衡量和改进 Android 应用启动时间
parent: Android Performance
nav_order: 5
---

![app_start_time.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/586e178bf61949f1a359902f62a29cbe~tplv-k3u1fbpfcp-watermark.image?)

让我们探索衡量和改进应用启动时间的不同方法，从这篇文章中，你可以发现还存在大量优化的机会，可以确定将你的优化工作集中在何处，并且可以看到优化后改进了多少。

## 启动时间的定义

### Time To Initial Display (TTID)

> TTID 指标用于测量应用生成第一帧所用的时间，包括进程初始化（如果是冷启动）、activity 创建（如果是冷启动/温启动）以及显示第一帧。

在 Android 4.4（API 级别 19）及更高版本中，[Logcat](https://developer.android.com/studio/command-line/logcat) 提供了一个 [Displayed](https://developer.android.com/topic/performance/vitals/launch-time?#time-initial) 值，用于测量从启动进程到完成在屏幕上绘制 activity 的第一帧之间经过的时间。

日志类似于以下示例：

```
ActivityManager: Displayed {package}/.StartupTiming: +1s434ms
```

### Time To Full Display (TTFD)

> TTFD 指标用于测量应用生成具有完整内容的第一帧所用的时间，包括在第一帧之后异步加载的内容。一般情况下，这是从网络加载的主要列表内容（由应用报告）。

在延迟加载的场景下，应用的 TTID 不包括所有资源的加载时间，可以将 TTFD 视为单独的指标：
    
例如，应用的界面可能已完全加载，并绘制了一些文本，但尚未显示应用必须从网络中加载的图片。

要测量 TTFD，你可以在所有内容显示后在 Activity 中手动调用 `reportFullyDrawn()` 方法。之后，可以在 Logcat 中看到它：

```
ActivityManager: Fully drawn {package}/.MainActivity: +3s524ms
```

## 如何在本地环境测量启动时间

除了上述提到的可以在 Logcat 中查看日志的方式查看启动时间，还有另种方法：

### ADB
adb shell 提供了一个命令行界面来启动一个应用程序：

```
adb shell am start -n {package}/.MainActivity
```

运行的结果中可以查看应用启动时间：

```
Starting: Intent { cmp={package}/.MainActivity }  
Status: ok  
LaunchState: COLD  
Activity: {package}/.MainActivity  
TotalTime: 1380  
WaitTime: 1381  
Complete
```

### Jetpack Macrobenchmark

使用 [Jetpack Macrobenchmark: Startup](https://developer.android.com/studio/profile/macrobenchmark#startup) 测量应用程序启动时间。
编写如下测试代码：
```kotlin
@RunWith(AndroidJUnit4::class)
class ExampleStartupBenchmark {
    @get:Rule
    val benchmarkRule = MacrobenchmarkRule()

    @Test
    fun startup() = benchmarkRule.measureRepeated(
        packageName = "com.example.macrobenchmark_codelab",
        metrics = listOf(StartupTimingMetric()),
        iterations = 5,
        startupMode = StartupMode.COLD,
    ) {
        pressHome()
        startActivityAndWait()

        val contentList = device.findObject(By.res("snack_list"))
        val searchCondition = Until.hasObject(By.res("snack_collection"))
        // Wait until a snack collection item within the list is rendered
        contentList.wait(searchCondition, 5_000)
    }
}
```
运行测试之后查看结果
![console](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9e12a91ad8b140ffa4210dc0fc112be2~tplv-k3u1fbpfcp-watermark.image?)

更详细的内容可查看文章[《使用 Macrobenchmark 测试 Android 应用性能》](https://juejin.cn/post/7203249440499712058)

## 如何在生产环境测量启动时间
测量生产环境设备上的启动时间也非常重要。它能提供更准确的测量结果，因为你的应用程序是在真实场景中使用许多不同的设备执行的。

### Android Vitals
在 [Android Vitals](https://developer.android.com/topic/performance/vitals/launch-time)（在 Google Play 控制台上）的 App 启动时间页面上，可以看到有关你的应用程序何时从 [cold](https://developer.android.com/topic/performance/launch-time.html#cold)、[warm](https://developer.android.com/topic/performance/launch-time.html#warm) 和 [hot](https://developer.android.com/topic/performance/launch-time.html#hot) 系统状态启动的详细信息。这些指标是自动计算的，无需任何开发工作。

![time_series.webp](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/8baf50d7011d4974bbe0567210f33c46~tplv-k3u1fbpfcp-watermark.image?)

![startup_time.webp](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/4242ed4193874e57885a76bf945b1452~tplv-k3u1fbpfcp-watermark.image?)

在查看数据时，有两个方面需要注意，

第一个是**如果应用程序在同一天从同一系统状态启动多次，则会记录当天的最长启动时间**。

这意味着只记录每天最差的启动时间，而不是任何发生的时间。

第二个（也是更重要的）是**当应用程序的第一帧完全加载时，将跟踪启动时间，即使它不是用户可以交互的页面**。

示例：如果应用程序以启动画面启动，则启动时间等于显示启动画面所需的时间。

对于带有加载或启动画面的应用程序来说，因为 Android Vitals 只测量加载屏幕显示之前的时间，而不是用户可以与应用交互的时间，所以得到的数据比实际启动时间更短。

<img src="https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f9237d40336141ca8dc86bc47df45028~tplv-k3u1fbpfcp-watermark.image?" alt="vitals_cold_startup_time" width="70%" />

### Firebase 性能监控

[Firebase Performance Monitoring](https://firebase.google.com/docs/perf-mon) 会自动收集与应用程序生命周期相关的多个跟踪记录。

**应用启动**

此跟踪测量用户打开应用程序和应用程序响应之间的时间。在控制台中，跟踪的名称是`_app_start `。此跟踪收集的指标是 “持续时间”。

- 在 `FirebasePerfProvider` 的 `onCreate` 方法执行时启动。

- `onResume()  `- 在调用第一个活动的方法时停止。

> 注意：如果应用程序不是从 activity 冷启动的，则不会生成任何跟踪记录。

这是 Firebase 性能监控仪表板中应用启动时间指标的示例：

![firebase_app_start_time.webp](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/07006ba9c24940db8a7991e7b2f58b0b~tplv-k3u1fbpfcp-watermark.image?)

Firebase Performance Monitoring 与 Android Vitals 类似，带有启动画面的应用程序的启动时间并不准确。

**自定义跟踪**

如果你的应用程序在启动时有启动动画，可以使用 Firebase Performance Monitoring [自定义代码跟踪](https://firebase.google.com/docs/perf-mon/custom-code-traces?platform=android#add-custom-code-traces)手动跟踪启动时间。

需要按照以下 4 个步骤实现：

1. 创建 StartupTimeProvider

`ContentProvider` 在 `Application.onCreate` 之前执行，所以可以使用它初始化 Firebase。通过调用 `StartupTrace.onColdStartInitiated` 方法注册 activity 生命周期回调，在用户可以交互的第一个页面 的 `onResume` 方法中停止跟踪。

```kotlin
class StartupTimeProvider: ContentProvider() {  
  
    ... ...
    
    companion object {  
        private val TAG = StartupTimeProvider::class.simpleName  
    }  

    private val mainHandler = Handler(Looper.getMainLooper())  

    override fun onCreate(): Boolean {  
        try {  
            if (FirebaseApp.initializeApp(context!!) == null) {  
                Log.w(TAG, "FirebaseApp initialization unsuccessful");  
            } else {  
                Log.i(TAG, "FirebaseApp initialization successful");  
            }  

            StartupTrace.onColdStartInitiated(context!!)  
            mainHandler.post(StartupTrace.StartFromBackgroundRunnable)  
        } catch (e: Exception) {  
            Log.e(TAG, "Failed to initialize StartupTimeProvider", e)  
        }  
        return true  
    }  

    ... ...
}
```

2. 在 AndroidManifest 文件上配置 StartupTimeProvider

需要在 `AndroidManifest.xml` 上声明 `ContentProvider`，以便在应用程序启动时调用。该 `initOrder` 属性定义了可能的最大整数，因此该 `ContentProvider` 是第一个被调用的。

因为我们已经在 `StartupTimeProvider` 上初始化 Firebase ，因此禁用了 `FirebaseInitProvider` 。

```
<?xml version= "1.0" encoding= "utf-8" ?>  
<manifest xmlns:android = "http://schemas.android.com/apk/res/android"  
xmlns:tools = "http://schemas .android.com/tools"  
package = "com.example">  
  
    <application>
    
        <provider  
            android:name="com.google.firebase.provider.FirebaseInitProvider"  
            android:authorities="${applicationId}.firebaseinitprovider"  
            tools:node="remove" />

        <provider  
            android:authorities = "${applicationId}.startup-time-provider"  
            android:exported = "false"  
            android:initOrder = "2147483647"  
            android:name = "com.example.startup.StartupTimeProvider" />  

    </application>
</manifest>
```
3. 创建 StartupTrace

该 `StartupTrace` 类将启动自定义跟踪，然后侦听所有 `activity.onResume`方法。在第一个非加载动画页面的 `onResume` 方法中停止跟踪。

```kotlin
object StartupTrace : Application.ActivityLifecycleCallbacks, LifecycleObserver {

    private val TAG = StartupTimeProvider::class.simpleName

    private val MAX_LATENCY_BEFORE_UI_INIT = TimeUnit.MINUTES.toMillis(1)

    var appStartTime: Long? = null
    private var onCreateTime: Long? = null
    var isStartedFromBackground = false
    var atLeastOnTimeOnBackground = false

    private var isRegisteredForLifecycleCallbacks = false
    private var appContext: Context? = null

    private var trace: Trace? = null

    var isTooLateToInitUI = false

    fun onColdStartInitiated(context: Context) {
        appStartTime = System.currentTimeMillis()
        trace = Firebase.performance.newTrace("cold_startup_time")
        trace!!.start()

        val appContext = context.applicationContext
        if (appContext is Application) {
            appContext.registerActivityLifecycleCallbacks(this)
            ProcessLifecycleOwner.get().lifecycle.addObserver(this)
            isRegisteredForLifecycleCallbacks = true
            this.appContext = appContext
        }
    }

    /** Unregister this callback after AppStart trace is logged.  */
    private fun unregisterActivityLifecycleCallbacks() {
        if (!isRegisteredForLifecycleCallbacks) {
            return
        }
        (appContext as Application).unregisterActivityLifecycleCallbacks(this)
        isRegisteredForLifecycleCallbacks = false
    }

    override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) {
        if (isStartedFromBackground || onCreateTime != null) {
            return
        }
        onCreateTime = System.currentTimeMillis()

        if ((onCreateTime!! - appStartTime!!) > MAX_LATENCY_BEFORE_UI_INIT) {
            isTooLateToInitUI = true
        }
    }

    override fun onActivityResumed(activity: Activity) {
        if (isStartedFromBackground || isTooLateToInitUI || atLeastOnTimeOnBackground) {
            unregisterActivityLifecycleCallbacks()
            return
        }

        if (activity !is LoadingActivity) {
            Log.d(TAG, "Cold start finished after ${System.currentTimeMillis() - appStartTime!!}ms")
            trace?.stop()
            trace = null

            if (isRegisteredForLifecycleCallbacks) {
                unregisterActivityLifecycleCallbacks()
            }
        }
    }

    @OnLifecycleEvent(Lifecycle.Event.ON_STOP)
    fun onEnterBackground() {
        atLeastOnTimeOnBackground = true
        ProcessLifecycleOwner.get().lifecycle.removeObserver(this)
    }
    
    ... ...

    object StartFromBackgroundRunnable : Runnable {
        override fun run() {
            if (onCreateTime == null) {
                isStartedFromBackground = true
            }
        }
    }
}
```

4. 在仪表板上添加自定义指标

在仪表板上，添加自定义指标 `cold_startup_time`。

![1_QHKrkKltdbfgWWcZDguiUw.webp](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/1c7898ac9f3242a68f410f3a64940174~tplv-k3u1fbpfcp-watermark.image?)

现在可以在仪表板上看到新指标：

![1_q5iCPo3LXDPx0tnyUTMDlw.webp](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/56d4482fb72f490c82808c1f049b9fa2~tplv-k3u1fbpfcp-watermark.image?)

使用此自定义跟踪，您还可以测量加载 activity 所消耗的时间。

<img src="https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/ab521e14c0bb45ccaedd238a9ab78e5a~tplv-k3u1fbpfcp-watermark.image?" alt="firebase performance monitor custom trace" width="70%" />

## 改进应用启动时间

一旦定义了良好的启动指标，在应用程序中检测它们可以让你了解并优先考虑改进启动性能以提供更好的用户体验。

为了实现启动时间性能改进，需要检查三个重要的地方：

-   任何 `ContentProvider.oncreate()`
-   你的 `Application.oncreate()`
-   第一个 `Activity.oncreate()`

### 修复启动崩溃

启动期间的崩溃是让用户放弃一个应用程序的最快的方式，因此在开始减少启动时间之前，先修复启动崩溃。

### 后台工作

除非必须，否则不要阻塞主线程。将 I/O 和非关键路径移出主线程。在应用程序启动之前，删除、延迟或将与启动体验不直接相关的任何工作移至后台。一些有用的提示：

- [Jetpack WorkManager](https://androidtopics.dipien.com/workmanager-a4b10f3ec49) 可以帮助你将工作转移到后台运行。
- 尽量避免在主线程上使用 [runBlocking](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/run-blocking.html)，因为它会运行一个新的 Kotlin 协程并阻塞当前线程直到它完成。
- 在主线程上使用 SharedPreference 的 [apply()](https://developer.android.com/reference/android/content/SharedPreferences.Editor#apply()) 而不是 [commit()](https://developer.android.com/reference/android/content/SharedPreferences.Editor#commit())。 `commit()` 方法是同步的，会暂停 UI 渲染。

### 删除或统一网络请求

应用程序在启动时会执行大量网络请求。尽量减少渲染首屏所需的网络请求次数，甚至统一多次调用，以节省时间。

### 延迟加载

尝试尽可能地进行延迟加载组件、模块和库，以便在第一次使用时尽可能晚地执行初始化或配置，而不是都在 `Application#onCreate` 或 `Activity#onCreate` 中初始化。

### 缓存内容

在某些情况下，缓存呈现第一个屏幕所需的内容可以节省启动时间。这需要你评估是尽快显示新内容更好，还是显示立即可用的内容更好。

### 跳过生产调试代码

应该在生产环境中跳过所有与调试相关的代码。比如：

-   [leakcanary](https://square.github.io/leakcanary/)
-   Logcat / [timber](https://github.com/JakeWharton/timber)
-   [StrictMode](https://developer.android.com/reference/android/os/StrictMode)

### 减少分析 / 跟踪库集成

在应用程序中集成的库越多，启动时间就越长。大多数用于分析或跟踪的第三方库都在 `ContentProvider` 中初始化，从而导致应用程序启动时间增加。这些第三方库包括 Firebase Analytics、Firebase Performance Monitoring、Firebase Crashlytics、Sentry、Instabug、Adjust、New Relic 等。

- 尝试将这些库减少到最低限度，并避免集成多个执行相同测量跟踪的库。
- 将分析和跟踪视为一种抽样，因此并非 100% 的用户都需要集成分析 / 跟踪库。

### Jetpack Startup

如果你使用 `ContentProvider` 来初始化应用程序的某些部分，那么应该将它们迁移到 [Jetpack Startup](https://developer.android.com/topic/libraries/app-startup) 。它提供了一种在应用程序启动时初始化组件的高效方法。库开发人员和应用程序开发人员都可以使用此库来简化启动顺序并明确设置初始化顺序。

关于它的一些使用链接：

-   [文档](https://developer.android.com/topic/libraries/app-startup)
-   [版本说明](https://developer.android.com/jetpack/androidx/releases/startup)
-   [源码](https://github.com/androidx/androidx/tree/androidx-main/startup)

### 禁用 FirebaseInitProvider

如果应用使用 Firebase SDK ，在使用 Gradle 进行构建时，Android 构建工具通常会自动将`FirebaseInitProvider` 合并到你的应用构建中。每个 `ContentProvider` 都会增加应用的启动时间，所以删除此 `ContentProvider` 可以帮助提高启动性能。

在应用的 Manifest 文件中，添加一条 `FirebaseInitProvider`的声明，并使用[节点标记](https://developer.android.com/studio/build/manifest-merge.html#node_markers)将其属性设置  `tools:node` 为值 `"remove"`。这会告诉 Android 构建工具不要在应用中包含此组件：

```xml
<provider  
    android:name = “com.google.firebase.provider.FirebaseInitProvider”  
    android:authorities = “${applicationId}.firebaseinitprovider”  
    tools:node = “remove” />
```

因为删除了 `FirebaseInitProvider`，所以需要在你的应用中的某处执行相同的初始化（在你自己的 `Jetpack App Startup` `Initializer` 中，以确保 Analytics 可以正常工作）：

```kotlin
if (FirebaseApp.initializeApp(context!!) == null) {  
    Log.w(TAG, "FirebaseApp initialization unsuccessful")  
} else {  
    Log.i(TAG, "FirebaseApp initialization successful")  
}
```

### 自定义启动页

从 Android 12 开始，需要迁移启动页到 [`SplashScreen`](https://developer.android.com/reference/kotlin/androidx/core/splashscreen/SplashScreen) API。这个 API 可以加快启动时间，并实现向后兼容，为所有 Android 系统版本的启动页创造一致的外观和感觉。

详情点击 [Splash Screen 迁移指南](https://developer.android.com/guide/topics/ui/splash-screen/migrate)查看。

### 基线配置文件

基线配置文件是 APK 中包含的类和方法的列表，[Android 运行时 (ART)](https://source.android.com/devices/tech/dalvik) 在安装期间使用它来预编译机器码的关键路径。这是一种配置文件引导优化 (PGO) 形式，可让应用优化启动、减少卡顿并提高性能。

有关详细信息，请阅读我的另一篇文章[使用 Baseline Profiles 改善 Android 应用性能](https://juejin.cn/post/7202788189739925561)。

## 参考

https://developer.android.com/topic/performance/vitals/launch-time
