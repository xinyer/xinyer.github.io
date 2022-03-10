---
layout: post
title:  "APK大小优化之资源优化"
tag: Android APK资源优化
---

# APK大小优化之资源优化

> [原文链接](https://jakewharton.com/smaller-apks-with-resource-optimization/)
> 
> 作者 Jake Wharton
> 
> 写作时间 01/09/2020
> 
> 翻译 xinyer
> 
> 翻译时间 09/03/2022

布局文件会在 Android APK 文件中出现多少次？我们可以用一个布局文件构建一个最小的APK来计算发生的次数。

用 Gradle 构建一个 Android 应用程序只需要一件事： 一个带有`AndroidManifest.xml`文件的包。我们可以添加一个虚拟的页面布局，内容只是`<merge/>`，因为我们只关心它的名称。

```shell
.
├── build.gradle
└── src
    └── main
        ├── AndroidManifest.xml
        └── res
            └── layout
                └── home_view.xml
```

运行 `gradle assemblerrelease` 将生成一个2,118字节的APK。我们可以使用 `xxd` 转储它的内容，然后查找 `home_view` 字节序列。

```shell
$ xxd build/outputs/apk/release/app-release-unsigned.apk
   ⋮
000004c0: 0000 0074 0000 0018 0000 0072 6573 2f6c  ...t.......res/l
000004d0: 6179 6f75 742f 686f 6d65 5f76 6965 772e  ayout/home_view.
000004e0: 786d 6c63 66e0 6028 6160 6060 6490 61d0  xmlcf.`(a```d.a.
   ⋮
00000570: 0000 0000 0000 0000 1818 7265 732f 6c61  ..........res/la
00000580: 796f 7574 2f68 6f6d 655f 7669 6577 2e78  yout/home_view.x
00000590: 6d6c 0000 0002 2001 f801 0000 7f00 0000  ml.... .........
   ⋮
00000700: 0000 0000 0909 686f 6d65 5f76 6965 7700  ......home_view.
00000710: 0202 1000 1400 0000 0100 0000 0100 0000  ................
   ⋮
00000870: 0000 ad04 0000 7265 732f 6c61 796f 7574  ......res/layout
00000880: 2f68 6f6d 655f 7669 6577 2e78 6d6c 504b  /home_view.xmlPK
   ⋮
```

基于此命令的输出，在APK中出现了三个未压缩的路径和一个只有名称的未压缩路径。

如果你没有读过我关于[计算zip条目大小](https://jakewharton.com/calculating-zip-file-entry-true-impact/)的文章，或者不熟悉[zip文件的结构](https://en.wikipedia.org/wiki/Zip_(file_format)#Structure)，那么zip文件就是一个文件条目列表，后面跟着一个包含所有可用条目的目录。每个条目都包含文件路径和目录。`xxd` 命令的输出结果中的第一条(条目头)和最后一条(目录记录)说明了这一点。

输出结果中中间出现的两条记录来自 `resources.arsc` 文件。此文件是一个资源分类的数据库文件。它的内容是可见的，因为该文件在APK中是未经压缩的。运行 `aapt dump——values resources build/outputs/apk/release/app-release-unsigned.apk` 显示 `home_view` 记录及其映射到路径:

```shell
Package Groups (1)
Package Group 0 id=0x7f packageCount=1 name=com.example
  Package 0 id=0x7f name=com.example
    type 0 configCount=1 entryCount=1
      spec resource 0x7f010000 com.example:layout/home_view: flags=0x00000000
      config (default):
        resource 0x7f010000 com.example:layout/home_view: t=0x03 d=0x00000000 (s=0x0008 r=0x00)
          (string8) "res/layout/home_view.xml"
```

APK包含在 `classes.dex` 文件中第五次出现的名称。它不会出现在 `xxd` 输出中，因为文件被压缩了。运行 `baksmali dump <(unzip -p build/outputs/apk/release/app-release-unsigned.apk classes.dex)` 显示了dex文件的字符串表，其中包含一个 `home_view` 的条目：

```shell
                           |[10] string_data_item
000227: 09                 |  utf16_size = 9
000228: 686f 6d65 5f76 6965|  data = "home_view"
000230: 7700               |
```

这是 `R.layout` 类中的字段，它将布局名称映射到一个唯一的整数值。顺便说一下，这个整数是`resource.arsc` 数据库中资源的索引，以查找相关的文件名和读取其XML内容。

总结一下我们的问题的答案，对于每个资源文件，完整路径出现三次，名称出现两次。

## 资源优化

Android Gradle插件4.2版本介绍了 `enableResourceOptimizations=true` 标志，它将针对资源进行优化。这将在合并资源时和 `resources.arsc` 文件打包到APK文件之前调用 `aapt optimize` 命令。无论 `minifyEnabled` 是否设置为true，资源优化只适用于release版本。

将该标志添加到 `gradle.properties` 中。我们可以用[diffuse](https://github.com/JakeWharton/diffuse)比较两个APK文件，看看它的效果。输出结果有点长，我们将按部分对其进行分解。

```shell
          │       compressed        │       uncompressed
          ├─────────┬───────┬───────┼─────────┬─────────┬───────
 APK      │ old     │ new   │ diff  │ old     │ new     │ diff
──────────┼─────────┼───────┼───────┼─────────┼─────────┼───────
      dex │   695 B │ 695 B │   0 B │ 1,016 B │ 1,016 B │   0 B
     arsc │   682 B │ 674 B │  -8 B │   576 B │   564 B │ -12 B
 manifest │   535 B │ 535 B │   0 B │ 1.1 KiB │ 1.1 KiB │   0 B
      res │   185 B │ 157 B │ -28 B │   116 B │   116 B │   0 B
    asset │     0 B │   0 B │   0 B │     0 B │     0 B │   0 B
    other │    22 B │  22 B │   0 B │     0 B │     0 B │   0 B
──────────┼─────────┼───────┼───────┼─────────┼─────────┼───────
    total │ 2.1 KiB │ 2 KiB │ -36 B │ 2.7 KiB │ 2.7 KiB │ -12 B
```

首先是APK中内容的不同。"compressed" 列是APK内部的大小，而 "uncompressed" 列是解压后时的大小。

`res` 表示单一资源文件的大小减少28字节。`arsc` 是 `resources.arsc` 文件减小8个字节。我们将很快看到这些变化的原因。

```shell
DEX      │ old │ new │ diff
─────────┼─────┼─────┼───────────
   files │   1 │   1 │ 0
 strings │  15 │  15 │ 0 (+0 -0)
   types │   8 │   8 │ 0 (+0 -0)
 classes │   2 │   2 │ 0 (+0 -0)
 methods │   3 │   3 │ 0 (+0 -0)
  fields │   1 │   1 │ 0 (+0 -0)


 ARSC    │ old │ new │ diff
─────────┼─────┼─────┼──────
 configs │   1 │   1 │  0
 entries │   1 │   1 │  0
```

这两个部分表示资源数据库的代码和内容。没有任何变化，因此我们可以推断优化没有影响 `R.layout.home_view` 和 `home_view` 资源条目。

```shell
=================
====   APK   ====
=================

   compressed   │  uncompressed  │
───────┬────────┼───────┬────────┤
 size  │ diff   │ size  │ diff   │ path
───────┼────────┼───────┼────────┼────────────────────────────
       │ -185 B │       │ -116 B │ - res/layout/home_view.xml
 157 B │ +157 B │ 116 B │ +116 B │ + res/eA.xml
 674 B │   -8 B │ 564 B │  -12 B │ ∆ resources.arsc
───────┼────────┼───────┼────────┼────────────────────────────
 831 B │  -36 B │ 680 B │  -12 B │ (total)
```

最后，文件更改的粒度差异显示了优化的效果。我们的布局资源的文件名被明显截断，并被移出了 `layout/` 文件夹!

在Gradle项目中，XML的文件夹和文件名是有意义的。文件夹是资源类型，其名称对应于 `.arsc` 文件中生成的字段和资源条目。然而，一旦这些文件在APK中，文件路径就没有任何意义了。通过尽可能的缩短名称来实现资源优化 (1)。

`aapt dump` 的输出也能确认这一点，资源数据库中文件的更改:

```shell
Package Groups (1)
Package Group 0 id=0x7f packageCount=1 name=com.example
  Package 0 id=0x7f name=com.example
    type 0 configCount=1 entryCount=1
      spec resource 0x7f010000 com.example:layout/home_view: flags=0x00000000
      config (default):
        resource 0x7f010000 com.example:layout/home_view: t=0x03 d=0x00000000 (s=0x0008 r=0x00)
          (string8) "res/eA.xml"
```

在APK中出现的所有三次路径现在都更短了，这节省了36字节。虽然36字节是一个非常小的数字，但请记住，整个二进制只有2,118字节。36字节的节省相当于减少了1.7%的尺寸!

## 真实案例

一个实际应用程序的资源数量远远不止一个。这种优化应用到实际应用程序时是什么样子的?

### Plaid

Nick Butcher的[Plaid](https://github.com/android/plaid)应用有734个资源文件。除了数量之外，资源文件的名称更具描述性(这是一种更长的说法)。与 `home_view` 不同，Plaid包含的名称是 `searchback_stem_search_to_back.xml` 、`attrs_elastic_drag_dismiss_frame_layout` 和 `designer_news_story_description.xml`。

在将项目更新到AGP 4.2之后，我使用 `diffuse` 来比较一个没有资源优化的版本和一个启用了资源优化的版本：

```shell
          │            compressed             │           uncompressed
          ├───────────┬───────────┬───────────┼───────────┬───────────┬───────────
 APK      │ old       │ new       │ diff      │ old       │ new       │ diff
──────────┼───────────┼───────────┼───────────┼───────────┼───────────┼───────────
      dex │   3.8 MiB │   3.8 MiB │       0 B │   9.9 MiB │   9.9 MiB │       0 B
     arsc │ 316.7 KiB │ 292.5 KiB │ -24.2 KiB │ 316.6 KiB │ 292.4 KiB │ -24.2 KiB
 manifest │     3 KiB │     3 KiB │       0 B │  11.9 KiB │  11.9 KiB │       0 B
      res │ 539.2 KiB │ 490.7 KiB │ -48.5 KiB │ 617.2 KiB │ 617.2 KiB │       0 B
   native │   4.6 MiB │   4.6 MiB │       0 B │   4.6 MiB │   4.6 MiB │       0 B
    asset │       0 B │       0 B │       0 B │       0 B │       0 B │       0 B
    other │  83.6 KiB │  83.6 KiB │       0 B │ 128.6 KiB │ 128.6 KiB │       0 B
──────────┼───────────┼───────────┼───────────┼───────────┼───────────┼───────────
    total │   9.4 MiB │   9.3 MiB │ -72.7 KiB │  15.6 MiB │  15.5 MiB │ -24.2 KiB
```

资源优化节省0.76%的APK文件大小。资源优化对 native 库的大小影响小于我的预期。

### SeriesGuide

Uwe Trottmann的[SeriesGuide](https://github.com/UweTrottmann/SeriesGuide)应用程序有1044个资源文件。与Plaid不同的是，它不需要 native 库，而 native 库会增加优化的影响。

我再次将项目更新到AGP 4.2，并使用`diffuse`来比较两个版本：

```shell
         │            compressed             │           uncompressed
          ├───────────┬───────────┬───────────┼───────────┬───────────┬───────────
 APK      │ old       │ new       │ diff      │ old       │ new       │ diff
──────────┼───────────┼───────────┼───────────┼───────────┼───────────┼───────────
      dex │   2.4 MiB │   2.4 MiB │       0 B │   5.7 MiB │   5.7 MiB │       0 B
     arsc │   1.7 MiB │   1.6 MiB │ -32.9 KiB │   1.7 MiB │   1.6 MiB │ -32.9 KiB
 manifest │   5.6 KiB │   5.6 KiB │       0 B │  28.3 KiB │  28.3 KiB │       0 B
      res │ 693.9 KiB │   628 KiB │   -66 KiB │ 992.2 KiB │ 992.2 KiB │       0 B
    asset │  39.9 KiB │  39.9 KiB │       0 B │ 100.4 KiB │ 100.4 KiB │       0 B
    other │ 118.1 KiB │ 118.1 KiB │       0 B │ 148.8 KiB │ 148.8 KiB │       0 B
──────────┼───────────┼───────────┼───────────┼───────────┼───────────┼───────────
    total │   4.9 MiB │   4.8 MiB │ -98.9 KiB │   8.6 MiB │   8.6 MiB │ -32.9 KiB
```

资源优化能够减少2.0%的APK大小!

### Tivi

Chris Banes的[Tivi](https://github.com/chrisbanes/tivi/)应用使用[Jetpack Compose](https://developer.android.com/jetpack/compose)编写了一个重要的部分，这意味着更少的资源。当前构建仍然包含776个资源文件。

由于使用了Compose, Tivi已经在使用最新的AGP4.2。通过两个快速构建，我们可以看到资源优化的影响:

```shell
          │            compressed             │           uncompressed
          ├───────────┬───────────┬───────────┼───────────┬───────────┬───────────
 APK      │ old       │ new       │ diff      │ old       │ new       │ diff
──────────┼───────────┼───────────┼───────────┼───────────┼───────────┼───────────
      dex │     3 MiB │     3 MiB │       0 B │   6.8 MiB │   6.8 MiB │       0 B
     arsc │ 363.4 KiB │ 337.9 KiB │ -25.6 KiB │ 363.3 KiB │ 337.7 KiB │ -25.6 KiB
 manifest │   3.6 KiB │   3.6 KiB │       0 B │  16.1 KiB │  16.1 KiB │       0 B
      res │ 680.4 KiB │ 629.2 KiB │ -51.2 KiB │   1.2 MiB │   1.2 MiB │       0 B
    asset │  39.9 KiB │  39.9 KiB │       0 B │ 100.4 KiB │ 100.4 KiB │       0 B
    other │ 159.9 KiB │ 151.7 KiB │  -8.2 KiB │ 306.3 KiB │ 254.8 KiB │ -51.5 KiB
──────────┼───────────┼───────────┼───────────┼───────────┼───────────┼───────────
    total │   4.2 MiB │   4.1 MiB │   -85 KiB │   8.8 MiB │   8.7 MiB │ -77.1 KiB
```

我们又一次达到了APK尺寸缩减2.0%的目标!

### 另外一种情况

到目前为止，这四个例子都没有使用签名的APK。APK签名有多个版本，如果你的 `minSdkVersion` 低于24，你需要在签名时包含版本1 (V1)签名。V1签名使用 Java 的 `.jar` [签名规范](https://docs.oracle.com/javase/tutorial/deployment/jar/intro.html)，该规范将每个文件作为 `META-INF/MANIFEST` 中的文本条目单独签名。

在为原始的单布局应用创建并配置keystore之后，使用 `unzip -c build/outputs/apk/release/app-release.apk META-INF/MANIFEST.MF`。

MF的签名如下:

```
Manifest-Version: 1.0
Built-By: Signflinger
Created-By: Android Gradle 4.2.0-alpha08

Name: AndroidManifest.xml
SHA-256-Digest: HdoGVd8U3Zjtf2VkGLExAPCQ1fq+kNL8eHKjVQXGI60=

Name: classes.dex
SHA-256-Digest: BVA1ApPvECg56DrrNPgD3jgv1edcM8VKYjcJEAG4G44=

Name: res/eA.xml
SHA-256-Digest: nDn7UQex2OWB3/AT054UvSAx9pYNSWwERCLfgdM6J6c=

Name: resources.arsc
SHA-256-Digest: 6w7i2Z9+LjwqlXS7YhhjzP/XhgvJF3PUuyJM60t0Qbw=
```

每个文件的完整路径显示出来，使每个资源路径的总出现次数达到4次。由于更短的名称将再次导致该文件包含更少的字节，因此资源优化具有更大的影响。

----

谷歌内部邮件向我介绍这一功能时声称，APK大小最终可以节省1-3%。根据真实案例的测试，这个范围似乎是正确的。最终，节省的资源取决于APK中的资源文件的大小和数量。

如果你已经在使用AGP 4.2并添加了 `android.enableResourceOptimizations=true`  配置到你的`gradle.properties` 文件，你可以享受这个免费的缩小APK大小的功能。如果您还没有使用AGP 4.2，请现在添加它，这样你下次升级时就不会忘记了!
