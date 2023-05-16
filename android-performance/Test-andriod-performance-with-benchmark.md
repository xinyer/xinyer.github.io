---
layout: default
title: 使用 Macrobenchmark 测试 Android 应用性能
parent: Android Performance
nav_order: 2
---
![main](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/34d069ecf9e3451a9298fabed2b06a44~tplv-k3u1fbpfcp-watermark.image?)

## 什么是 Benchmark（基准测试）
基准测试（benchmarking）是一种测量和评估软件性能指标的活动。你可以在特定时间（比如每次应用发布时）通过基准测试建立一个已知的性能水平，称为基准线。当系统的软件、硬件或更改代码等环境发生变化之后再进行一次基准测试以确定哪些变化对性能产生影响，从而有针对性的进行性能优化。

## 什么是 Macrobenchmark
[Macrobenchmark](https://developer.android.com/studio/profile/macrobenchmark) 是 Android 系统上对应用进行基准测试的库，可以直接针对在搭载 Android M (API 23) 或更高版本系统的设备上运行的应用编写启动和运行时性能测试。

## Macrobenchmark vs Microbenchmark
虽然现有的 [Microbenchmark](https://developer.android.com/topic/performance/benchmarking/microbenchmark-overview) 库允许直接对应用程序代码进行基准测试，但它是围绕测量 CPU 运行频率而设计的，而且会达到最佳性能（JIT，磁盘缓存）。  
  
Macrobenchmark 则通过实际启动和滚动应用程序来测量终端用户的体验，而且你可以控制测试的性能环境（例如指定启动方式是冷启动）。

|  | Macrobenchmark|  Microbenchmark |
| ---- | ---- | ---- |
| 函数 | 测量高级别入口点或交互（例如，activity 启动或列表滚动） | 测量各个函数 |
| 范围 | 对整个应用进行进程外测试 | 对 CPU 工作情况进行进程内测试 |
| 速度 | 迭代速度中等（可能超过 1 分钟）| 迭代速度较快（通常不到 10 秒）|
| 跟踪 | 结果包含性能分析轨迹 | 可选的方法采样和跟踪 |
| 最低 API 版本 | 23 | 14 |

## 编写 Macrobenchmarks
基准测试通过 Macrobenchmark 库中的 `MacrobenchmarkRule` JUnit4 规则 API 提供：

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

## 运行基准测试

像运行单元测试一样，可以有以下几种方式运行：

1. 右键点击运行按钮，选择要运行的测试类或方法
![run](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/51b6f338b3f847629731e32748110b1e~tplv-k3u1fbpfcp-watermark.image?)
2. 使用gradle命令运行所有的测试
```
./gradlew :macrobenchmark:connectedCheck
```
3. 单独运行指定的测试
```
./gradlew :macrobenchmark:connectedCheck -P android.testInstrumentationRunnerArguments.class=com.example.macrobenchmark_codelab.ExampleStartupBenchmark#startup
```

## 查看测试结果
运行成功之后，测试结果显示在结果面板中。
![console](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9e12a91ad8b140ffa4210dc0fc112be2~tplv-k3u1fbpfcp-watermark.image?)

点击结果中的链接，打开CPU Profiler可以查看更多详细的信息。
![cpu profiler](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f1a65e11d3f14a129223d5093e2076c4~tplv-k3u1fbpfcp-watermark.image?)

当然，除了直接显示到面板中，测试结果还会以JSON格式保存在文件中。这些文件位于`build/outputs/connected_android_test_additional_output/debugAndroidTest/connected/`目录中。

![json file](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/1750f0863afa4d59ac34781142ed6f0c~tplv-k3u1fbpfcp-watermark.image?)

JSON文件中包含运行基准测试的设备信息及实际运行的基准测试的信息，如下：
```json
{
    "context": {
        "build": {
            "brand": "Xiaomi",
            "device": "umi",
            "fingerprint": "Xiaomi/umi/umi:12/SKQ1.211006.001/V13.0.7.0.SJBCNXM:user/release-keys",
            "model": "Mi 10",
            "version": {
                "sdk": 31
            }
        },
        "cpuCoreCount": 8,
        "cpuLocked": false,
        "cpuMaxFreqHz": 2841600000,
        "memTotalBytes": 7980748800,
        "sustainedPerformanceModeEnabled": false
    },
    "benchmarks": [
        {
            "name": "startup",
            "params": {},
            "className": "com.example.macrobenchmark.ExampleStartupBenchmark",
            "totalRunTimeNs": 28672528896,
            "metrics": {
                "timeToFullDisplayMs": {
                    "minimum": 746.078958,
                    "maximum": 963.759896,
                    "median": 834.385312,
                    "runs": [
                        834.385312,
                        851.603906,
                        963.759896,
                        755.41651,
                        746.078958
                    ]
                },
                "timeToInitialDisplayMs": {
                    "minimum": 392.343438,
                    "maximum": 505.486927,
                    "median": 440.035989,
                    "runs": [
                        440.035989,
                        459.768281,
                        505.486927,
                        395.72776,
                        392.343438
                    ]
                }
            },
            "sampledMetrics": {},
            "warmupIterations": 0,
            "repeatIterations": 5,
            "thermalThrottleSleepSeconds": 0
        }
    ]
}
```

## 自定义基准

### 捕获指标

指标是从基准中提取的主要信息类型。可用选项包括 [`StartupTimingMetric`](https://developer.android.com/reference/kotlin/androidx/benchmark/macro/StartupTimingMetric)、[`FrameTimingMetric`](https://developer.android.com/reference/kotlin/androidx/benchmark/macro/FrameTimingMetric) 和 [`TraceSectionMetric`](https://developer.android.com/reference/kotlin/androidx/benchmark/macro/TraceSectionMetric)。

### CompilationMode

宏基准可以指定 [CompilationMode](https://developer.android.com/reference/kotlin/androidx/benchmark/macro/CompilationMode)，用于定义应该将应用的多大部分从 DEX 字节码（APK 中的字节码格式）预编译为机器代码（类似于预编译的 C++）。

在 Android 7 及更高版本中，您可以自定义 `CompilationMode` 以影响设备上的预编译量，从而模拟不同级别的预先 (AOT) 编译或 JIT 缓存。分为3个级别，包括 [`CompilationMode.Full`](https://developer.android.com/reference/kotlin/androidx/benchmark/macro/CompilationMode.Full)、[`CompilationMode.Partial`](https://developer.android.com/reference/kotlin/androidx/benchmark/macro/CompilationMode.Partial) 和 [`CompilationMode.None`](https://developer.android.com/reference/kotlin/androidx/benchmark/macro/CompilationMode.None)。

### StartupMode

如需执行 activity 启动，您可以传递一种预定义的启动模式（[`COLD`、`WARM` 或 `HOT` 中的一种](https://developer.android.com/reference/kotlin/androidx/benchmark/macro/StartupMode)）。此参数会更改 activity 的启动方式，以及测试开始时的进程状态。

### 自定义事件

利用自定义跟踪事件进行应用插桩非常有用，这些事件会与跟踪报告的其余部分一起显示，有助于找出应用特有的问题。

以下示例代码展示列表显示过程中自定义的创建视图和获取数据的事件：
```kotlin
class MyAdapter : RecyclerView.Adapter<MyViewHolder>() {
    override fun onCreateViewHolder(parent: ViewGroup,
            viewType: Int): MyViewHolder {
        trace("MyAdapter.onCreateViewHolder") {
            MyViewHolder.newInstance(parent)
        }
    }

    override fun onBindViewHolder(holder: MyViewHolder, position: Int) {
        trace("MyAdapter.onBindViewHolder") {
            trace("MyAdapter.queryDatabase")
                val rowItem = queryDatabase(position)
                dataset.add(rowItem)
            }
            holder.bind(dataset[position])
        }
    }
}
```