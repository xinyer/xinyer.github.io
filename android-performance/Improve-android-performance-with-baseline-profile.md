---
layout: default
title: 使用 Baseline Profiles 改善 Android 应用性能
parent: Android Performance
nav_order: 1
---

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/1d5d6fae8c8c4f61ac85a6cf386e0d58~tplv-k3u1fbpfcp-watermark.image?)

## 什么是 Baseline Profiles
Baseline Profiles 可以避免对包含的代码路径执行解译和[即时 (JIT)](https://developer.android.com/about/versions/nougat/android-7.0?hl=zh-cn#jit_aot) 编译步骤，从而让代码执行速度从首次启动开始提高约 30%。通过在应用或库中分发 Baseline Profiles，[Android 运行时 (ART)](https://developer.android.com/about/versions/nougat/android-7.0#jit_aot) 可以通过预先 (AOT) 编译来优化包含的代码路径，从而针对每位新用户以及每个应用更新提升性能。这种配置文件引导的优化 (PGO) 可让应用优化启动、减少互动卡顿，并提高整体的运行时性能，从而让用户从首次启动开始便获得更好的使用体验。

## Baseline Profiles 的优势

1. 所有用户交互（例如应用启动、切换屏幕或滚动内容）都会从首次运行开始变得更加顺畅。提升应用的速度和响应能力有助于提高日活跃用户数和平均回访率。
2. 引导式 AOT 编译不依赖于用户设备，可以在开发机器（而非移动设备）上为每个版本执行一次。与单纯依赖 [Cloud Profiles](https://developer.android.com/topic/performance/baselineprofiles/overview#cloud-profiles) 相比，可以更快速地实现应用优化。

## 创建 Baseline Profiles
作为应用开发者，你可以使用 [Jetpack Macrobenchmark 库](https://developer.android.com/macrobenchmark)和 [`BaselineProfileRule`](https://developer.android.com/reference/kotlin/androidx/benchmark/macro/junit4/BaselineProfileRule) 为每个应用版本自动生成配置文件。用于生成配置文件的入口点是 `collectBaselineProfile` 函数。

```kotlin
@RunWith(AndroidJUnit4::class)
class BaselineProfileGenerator {

	@get:Rule
	val rule = BaselineProfileRule()

	@Test
	fun generate() {
		rule.collectBaselineProfile("com.example.app") {
			// TODO Add interactions for the typical user journeys
		}
	}
}
```
在 `profileBlock` lambda 中，需要指定涵盖应用典型用户体验历程的互动。该库将运行 `profileBlock` 多次；它会收集调用的类和函数以进行优化，并生成设备端的 Baseline Profiles。

以应用启动历程为例，启动过程包括：
1.  按主屏幕按钮以确保应用状态已重启
2.  启动默认 activity 并等待第一帧呈现
3.  等待内容加载并呈现，且用户能够与其交互

```kotlin
fun MacrobenchmarkScope.startApplicationJourney() {
	pressHome()
	startActivityAndWait()
	val contentList = device.findObject(By.res("snack_list"))
	// Wait until a snack collection item within the list is rendered
	contentList.wait(Until.hasObject(By.res("snack_collection")), 5_000)
}
```

同样也可以编写滚动列表的历程，包括：
1. 查找列表的界面元素
2. 设置手势外边距以免触发系统导航
3. 滚动列表并等待界面稳定下来

```kotlin
fun MacrobenchmarkScope.scrollSnackListJourney() {
	val snackList = device.findObject(By.res("snack_list"))
	// Set gesture margin to avoid triggering gesture navigation
	snackList.setGestureMargin(device.displayWidth / 5)
	snackList.fling(Direction.DOWN)
	device.waitForIdle()
}
```
执行 BaselineProfileGenerator 的 generate 方法，查看运行结果如下：

![4b5b2d0091b4518c_1920.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/4443b6d77cb94ece9423621e9600f56c~tplv-k3u1fbpfcp-watermark.image?)

生成的 Baseline Profiles 在`/build/outputs/` 中的 `managed_device_android_test_additional_output/` 文件夹。

![b104f315f06b3578_1920.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b804f9a5577e4291a88729635d6d03ef~tplv-k3u1fbpfcp-watermark.image?)

## 应用生成的 Baseline Profiles
1. 复制生成的 Baseline Profiles 到`src/main` 文件夹，并重命名为`baseline-prof.txt`。
![8973f012921669f6_1920.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c0c41d2d9be042e2a1ab8ac5dda5aded~tplv-k3u1fbpfcp-watermark.image?)
2. 将 `profileinstaller` 依赖项添加到 `:app` 模块。
```
dependencies {
	implementation("androidx.profileinstaller:profileinstaller:1.2.0")
}
```
Baseline Profiles 随应用打包发布，当用户安装应用时，Baseline Profiles 也会被编译，从而在首次运行应用时实现更好的性能。

## Baseline Profiles 的运作方式

在开发应用或库时，需要考虑定义 Baseline Profiles，以涵盖渲染时间或延迟时间非常重要的常见用户交互流程。

1. 系统会为应用生成 Profiles 规则，并在应用中将其编译为二进制文件形式（可以在 `assets/dexopt/baseline.prof` 中找到）。然后可以照常将相应 AAB 上传到 Google Play。
2. Google Play 会处理该 Profiles 文件，然后将其与 APK 一起直接发布给用户。在应用安装期间，ART 会对 Profiles 文件中的方法执行 AOT 编译，以便提升这些方法的执行速度。如果 Profiles 文件包含应用启动或帧渲染期间使用的方法，用户可能会获得启动速度更快且卡顿更少的体验。
3. 此流程可与 Cloud Profiles 汇总配合使用，以随着时间的推移根据应用的实际使用情况对性能进行微调。
![baselineprofile_workflow.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/49583f55c1e643c5b4f2816f371ed692~tplv-k3u1fbpfcp-watermark.image?)

> Cloud Profiles 可以提供另一种形式的 PGO，它们由 Google Play 商店进行汇总，并与Baseline Profiles 一起分发以进行安装时编译。虽然 Cloud Profiles 是由用户与应用的实际互动驱动的，但它们在更新后需要几天到几周的时间才能分发，这就限制了它们的可用性。此外，Cloud Profiles 仅支持搭载 Android 9（API 级别 29）或更高版本的 Android 设备。
