---
title: 设计模式
date: 2023-06-17 11:11:00 +0800
categories: [软件开发]
tags: [设计模式]
---

- [1. 创建型模型（Creational Patterns）](#1-创建型模型creational-patterns)
  - [1.1. 工厂模式（Factory Pattern）](#11-工厂模式factory-pattern)
    - [1.1.1. 工厂模式的好处是什么？](#111-工厂模式的好处是什么)
    - [1.1.2. 什么场景下会使用工厂模式？](#112-什么场景下会使用工厂模式)
  - [1.2. 抽象工厂模式（Abstract Factory Pattern）](#12-抽象工厂模式abstract-factory-pattern)
    - [1.2.1. 抽象工厂模式与工厂模式的区别](#121-抽象工厂模式与工厂模式的区别)
  - [1.3. 单例模式（Singleton Pattern）](#13-单例模式singleton-pattern)
    - [1.3.1. 静态内部类为什么能保证单例？](#131-静态内部类为什么能保证单例)
    - [1.3.2. 为什么枚举的实现方式能保证单例？](#132-为什么枚举的实现方式能保证单例)
  - [1.4. 建造者模式（Builder Pattern）](#14-建造者模式builder-pattern)
  - [1.5. 原型模式（Prototype Pattern）](#15-原型模式prototype-pattern)
    - [1.5.1. 原型模式的使用场景有哪些？](#151-原型模式的使用场景有哪些)
- [2. 结构型模型（Structural Patterns）](#2-结构型模型structural-patterns)
  - [2.1. 适配器模式（Adapter Pattern）](#21-适配器模式adapter-pattern)
  - [2.2. 桥接模式（Bridge Pattern）](#22-桥接模式bridge-pattern)
  - [2.3. 装饰器模式（Decorator Pattern）](#23-装饰器模式decorator-pattern)
  - [2.4. 组合模式（Composite Pattern）](#24-组合模式composite-pattern)
  - [2.5. 外观模式（Facade Pattern）](#25-外观模式facade-pattern)
  - [2.6. 享元模式（Flyweight Pattern）](#26-享元模式flyweight-pattern)
  - [2.7. 代理模式（Proxy Pattern）](#27-代理模式proxy-pattern)
- [3. 行为型模式（Behavioral Patterns）:](#3-行为型模式behavioral-patterns)
  - [3.1. 模板方法模式（Template Method Pattern）](#31-模板方法模式template-method-pattern)
  - [3.2. 策略模式（Strategy Pattern）](#32-策略模式strategy-pattern)
  - [3.3. 观察者模式（Observer Pattern）](#33-观察者模式observer-pattern)
  - [3.4. 迭代器模式（Iterator Pattern）](#34-迭代器模式iterator-pattern)
  - [3.5. 命令模式（Command Pattern）](#35-命令模式command-pattern)
  - [3.6. 备忘录模式（Memento Pattern）](#36-备忘录模式memento-pattern)
  - [3.7. 解释器模式（Interpreter Pattern）](#37-解释器模式interpreter-pattern)
  - [3.8. 状态模式（State Pattern）](#38-状态模式state-pattern)
  - [3.9. 职责链模式（Chain of Responsibility Pattern）](#39-职责链模式chain-of-responsibility-pattern)
  - [3.10. 访问者模式（Visitor Pattern）](#310-访问者模式visitor-pattern)
  - [3.11. 中介者模式（Mediator Pattern）](#311-中介者模式mediator-pattern)
- [4. 并发模式（Concurrency Patterns）:](#4-并发模式concurrency-patterns)
  - [4.1. 信号量模式（Semaphore Pattern）](#41-信号量模式semaphore-pattern)
  - [4.2. 互斥锁模式（Mutex Pattern）](#42-互斥锁模式mutex-pattern)
  - [4.3. 生产者 - 消费者模式（Producer-Consumer Pattern）](#43-生产者---消费者模式producer-consumer-pattern)
  - [4.4. 读者 - 写者模式（Reader-Writer Pattern）](#44-读者---写者模式reader-writer-pattern)
  - [4.5. 资源池模式（Resource Pool Pattern）](#45-资源池模式resource-pool-pattern)
- [5. 架构模式（Architectural Patterns）:](#5-架构模式architectural-patterns)
  - [5.1. MVC 模式（Model-View-Controller Pattern）](#51-mvc-模式model-view-controller-pattern)
  - [5.2. MVP 模式（Model-View-Presenter Pattern）](#52-mvp-模式model-view-presenter-pattern)
  - [5.3. MVVM 模式（Model-View-ViewModel Pattern）](#53-mvvm-模式model-view-viewmodel-pattern)
  - [5.4. 责任分离模式（Separation of Concerns Pattern）](#54-责任分离模式separation-of-concerns-pattern)
  - [5.5. 依赖注入模式（Dependency Injection Pattern）](#55-依赖注入模式dependency-injection-pattern)
  - [5.6. 服务定位器模式（Service Locator Pattern）](#56-服务定位器模式service-locator-pattern)
  - [5.7. 事件驱动架构模式（Event-Driven Architecture Pattern）](#57-事件驱动架构模式event-driven-architecture-pattern)

# 1. 创建型模型（Creational Patterns）

## 1.1. 工厂模式（Factory Pattern）

在工厂模式中，我们在创建对象时不会对客户端暴露创建逻辑，并且是通过使用一个共同的接口来指向新创建的对象。

当使用 Kotlin 语言实现工厂模式时，可以按照以下步骤进行操作：

1. 定义一个接口或抽象类作为产品的共同接口。

```kotlin
interface Product {
    fun doSomething()
}
```

2. 创建具体产品类实现产品接口。

```kotlin
class ConcreteProductA : Product {
    override fun doSomething() {
        println("ConcreteProductA: Doing something.")
    }
}

class ConcreteProductB : Product {
    override fun doSomething() {
        println("ConcreteProductB: Doing something.")
    }
}
```

3. 创建一个工厂类，用于创建产品对象。

```kotlin
class ProductFactory {
    fun createProduct(type: String): Product? {
        return when (type) {
            "A" -> ConcreteProductA()
            "B" -> ConcreteProductB()
            else -> null
        }
    }
}
```

4. 在客户端代码中使用工厂模式创建产品对象。

```kotlin
fun main() {
    val factory = ProductFactory()

    val productA = factory.createProduct("A")
    productA?.doSomething()

    val productB = factory.createProduct("B")
    productB?.doSomething()
}
```

在这个示例中，`Product` 接口定义了产品的共同行为，`ConcreteProductA` 和 `ConcreteProductB` 是具体的产品类。`ProductFactory` 是工厂类，根据传入的参数来创建相应的产品对象。在客户端代码中，我们通过工厂类创建具体产品对象，并调用其方法。

### 1.1.1. 工厂模式的好处是什么？
工厂模式在软件开发中具有以下好处：

1. 封装对象的创建逻辑：工厂模式将对象的创建逻辑封装在工厂类中，客户端代码只需要与工厂类进行交互，无需直接实例化具体的产品对象。这样可以降低代码的耦合度，客户端代码只需要关注产品的使用，而不需要了解具体的创建细节。

2. 提供灵活性和可扩展性：通过工厂模式，可以轻松地添加新的产品类型，而无需修改客户端代码。工厂类负责创建产品对象，客户端代码只需要通过工厂类获取所需的产品，对于新增的产品类型，只需要在工厂类中添加相应的创建逻辑即可。这样在系统需要扩展时，可以遵循开闭原则，减少对现有代码的修改。

3. 隐藏产品的具体实现：工厂模式将产品的实现细节隐藏在工厂类中，客户端代码无需了解具体产品的创建过程和实现细节。这样可以提高代码的安全性和可维护性，客户端代码只需要与产品的共同接口进行交互。

4. 可以根据不同条件创建不同产品：工厂模式可以根据客户端的需求或运行时的条件，动态地创建不同类型的产品对象。客户端代码只需要提供相应的参数或条件，工厂类根据这些参数或条件来创建合适的产品对象。这样可以实现更灵活和可定制化的对象创建过程。

### 1.1.2. 什么场景下会使用工厂模式？

1. 当一个系统需要独立于其产品的创建、组合和表示时，可以使用工厂模式。这样可以将产品的创建逻辑集中在一个工厂类中，提供统一的创建接口。

2. 当需要根据不同的条件创建不同类型的产品对象时，可以使用工厂模式。工厂类可以根据客户端的需求或运行时的条件，动态地创建适合的产品对象。

3. 当系统需要支持扩展，以便在将来添加新产品时无需修改现有代码时，可以使用工厂模式。工厂模式遵循开闭原则，通过工厂类的扩展，可以添加新的产品类型而无需修改客户端代码。

4. 当需要隐藏产品的具体实现细节，只向客户端提供产品的抽象接口时，可以使用工厂模式。客户端只需要与产品的共同接口进行交互，无需了解具体产品的创建和实现细节。

## 1.2. 抽象工厂模式（Abstract Factory Pattern）
当使用 Kotlin 语言实现抽象工厂模式时，可以按照以下步骤进行操作：

1. 定义抽象产品接口或抽象类。

```kotlin
interface ProductA {
    fun doSomething()
}

interface ProductB {
    fun doSomething()
}
```

2. 创建具体产品类实现抽象产品接口或抽象类。

```kotlin
class ConcreteProductA1 : ProductA {
    override fun doSomething() {
        println("ConcreteProductA1: Doing something.")
    }
}

class ConcreteProductA2 : ProductA {
    override fun doSomething() {
        println("ConcreteProductA2: Doing something.")
    }
}

class ConcreteProductB1 : ProductB {
    override fun doSomething() {
        println("ConcreteProductB1: Doing something.")
    }
}

class ConcreteProductB2 : ProductB {
    override fun doSomething() {
        println("ConcreteProductB2: Doing something.")
    }
}
```

3. 创建抽象工厂接口或抽象类。

```kotlin
interface AbstractFactory {
    fun createProductA(): ProductA
    fun createProductB(): ProductB
}
```

4. 创建具体工厂类实现抽象工厂接口或抽象类，用于创建一组相关的产品。

```kotlin
class ConcreteFactory1 : AbstractFactory {
    override fun createProductA(): ProductA {
        return ConcreteProductA1()
    }

    override fun createProductB(): ProductB {
        return ConcreteProductB1()
    }
}

class ConcreteFactory2 : AbstractFactory {
    override fun createProductA(): ProductA {
        return ConcreteProductA2()
    }

    override fun createProductB(): ProductB {
        return ConcreteProductB2()
    }
}
```

5. 在客户端代码中使用抽象工厂模式创建产品对象。

```kotlin
fun main() {
    val factory1: AbstractFactory = ConcreteFactory1()
    val productA1: ProductA = factory1.createProductA()
    val productB1: ProductB = factory1.createProductB()

    productA1.doSomething()
    productB1.doSomething()

    val factory2: AbstractFactory = ConcreteFactory2()
    val productA2: ProductA = factory2.createProductA()
    val productB2: ProductB = factory2.createProductB()

    productA2.doSomething()
    productB2.doSomething()
}
```

在这个示例中，`ProductA` 和 `ProductB` 是抽象产品接口，`ConcreteProductA1`、`ConcreteProductA2`、`ConcreteProductB1` 和 `ConcreteProductB2` 是具体产品类。`AbstractFactory` 是抽象工厂接口，`ConcreteFactory1` 和 `ConcreteFactory2` 是具体工厂类。在客户端代码中，通过具体工厂类创建一组相关的产品，然后可以调用产品的方法进行操作。

抽象工厂模式适用于需要创建一组相关的产品对象，并且这组产品对象之间存在一定的关联或约束关系的场景。通过抽象工厂模式，可以封装产品对象的创建逻辑，并提供统一的工厂接口，使得客户端代码与具体产品类解耦，并且可以轻松地

### 1.2.1. 抽象工厂模式与工厂模式的区别
抽象工厂模式（Abstract Factory Pattern）和工厂模式（Factory Pattern）都是创建型设计模式，用于对象的创建。它们之间的主要区别在于关注的层次不同。

1. 抽象程度不同：
   - 工厂模式关注的是单个对象的创建。它通过一个工厂类封装了对象的创建逻辑，并提供一个统一的接口供客户端代码使用。
   - 抽象工厂模式关注的是一组相关对象的创建。它通过抽象工厂接口或抽象类定义了一组相关产品的创建方法，具体的工厂类实现这个接口或继承这个抽象类，从而创建一组相关的产品。

2. 创建对象的数量不同：
   - 工厂模式通常只创建一个对象。客户端代码通过工厂类的方法调用来创建特定类型的对象。
   - 抽象工厂模式创建一组相关的对象。客户端代码使用具体的工厂类来创建一组相关产品。

3. 关注点不同：
   - 工厂模式关注的是对象的创建过程。它通过工厂类将对象的创建逻辑封装起来，客户端代码只需调用工厂类的方法来获取对象。
   - 抽象工厂模式关注的是一组相关对象的创建和使用。它提供了一种组织和管理一组相关产品的方式，客户端代码可以通过抽象工厂接口或抽象类来创建一组相关产品。

4. 灵活性不同：
   - 工厂模式相对较灵活，可以根据需求创建不同类型的对象。但是当需要添加新的产品类型时，需要修改工厂类的代码。
   - 抽象工厂模式更加灵活，它支持在不修改客户端代码的情况下添加新的产品族。通过添加新的具体工厂类，可以创建一组新的产品，而无需修改现有代码。

综上所述，工厂模式主要关注单个对象的创建，而抽象工厂模式关注一组相关对象的创建。工厂模式比较简单，适用于需要创建单个对象的场景，而抽象工厂模式适用于需要创建一组相关产品，且需要支持产品族扩展的场景。选择使用哪种模式取决于需求的复杂性和灵活性的要求。

##  1.3. 单例模式（Singleton Pattern）

在 Java 语言中，有多种方式可以实现单例模式。以下是几种常见的单例模式实现方式：

1. 饿汉式（Eager Initialization）：
```java
public class Singleton {
    private static final Singleton instance = new Singleton();
    
    private Singleton() {
        // 私有构造方法
    }
    
    public static Singleton getInstance() {
        return instance;
    }
}
```

2. 懒汉式（Lazy Initialization）：
```java
public class Singleton {
    private static Singleton instance;
    
    private Singleton() {
        // 私有构造方法
    }
    
    public static synchronized Singleton getInstance() {
        if (instance == null) {
            instance = new Singleton();
        }
        return instance;
    }
}
```

3. 双重检查锁（Double-Checked Locking）：
```java
public class Singleton {
    private static volatile Singleton instance;
    
    private Singleton() {
        // 私有构造方法
    }
    
    public static Singleton getInstance() {
        if (instance == null) {
            synchronized (Singleton.class) {
                if (instance == null) {
                    instance = new Singleton();
                }
            }
        }
        return instance;
    }
}
```

4. 静态内部类（Static Inner Class）：
```java
public class Singleton {
    private Singleton() {
        // 私有构造方法
    }
    
    private static class SingletonHolder {
        private static final Singleton instance = new Singleton();
    }
    
    public static Singleton getInstance() {
        return SingletonHolder.instance;
    }
}
```

5. 枚举（Enum）：
```java
public enum Singleton {
    INSTANCE;
    
    public void doSomething() {
        // 单例实例的方法
    }
}
```

###  1.3.1. 静态内部类为什么能保证单例？

静态内部类的实现方式可以保证单例的原因如下：

1. 延迟加载：静态内部类只有在被使用时才会被加载，因此实现了延迟加载的效果。当第一次调用`getInstance()`方法时，才会加载内部类并创建单例实例。

2. 线程安全：静态内部类的加载过程由 JVM 保证线程安全。在类加载过程中，JVM 会保证只有一个线程加载该类，从而保证了单例实例的创建是线程安全的。

3. 懒加载和高效率：静态内部类实现了懒加载，避免了在类加载时就创建实例的开销。同时，静态内部类的加载是基于类加载器的延迟加载机制，相对于其他实现方式，静态内部类的加载效率更高。

4. 实现简单：相比于其他实现方式，静态内部类的实现相对简单明了。内部类持有外部类的实例，并在静态内部类中创建单例实例，通过类加载机制来保证线程安全和懒加载，无需使用 synchronized 关键字或 volatile 修饰符。

总之，静态内部类通过利用类加载机制来实现线程安全的懒加载单例。它提供了高效率、简单明了的实现方式，被广泛认可并被推荐作为实现单例模式的一种方式。

###  1.3.2. 为什么枚举的实现方式能保证单例？

枚举的实现方式可以保证单例的原因如下：

1. JVM 保证单例：在 Java 中，枚举类型的实例是由 JVM 在类加载过程中自动创建的，且保证只有一个实例存在。因此，枚举实例的创建是由 JVM 保证的，无法通过其他方式再次创建实例。

2. 线程安全：枚举实例的创建是在类加载过程中完成的，由 JVM 保证了线程安全。在多线程环境下，多个线程可以同时访问枚举实例，而不会出现线程安全问题。

3. 防止反射和序列化攻击：枚举类型天然地具有防止反射和序列化攻击的特性。由于枚举实例的创建是由 JVM 控制的，无法通过反射调用私有构造函数来创建新的实例。同时，枚举类型默认实现了`Serializable`接口，并且在序列化和反序列化过程中保持单例的一致性。

4. 简洁明了：使用枚举实现单例非常简洁明了，不需要编写大量的代码来处理线程安全和序列化等问题。枚举类型提供了隐式的单例保证，开发人员不需要担心并发访问和其他单例实现方式可能出现的问题。

总之，枚举的实现方式通过 JVM 保证了单例的创建、线程安全和防止反射、序列化攻击等特性。它提供了一种简洁、安全且易于理解的单例实现方式，被广泛应用于 Java 开发中。

## 1.4. 建造者模式（Builder Pattern）

在 Kotlin 中实现建造者模式（Builder Pattern），可以按照以下步骤进行操作：

1. 创建一个产品类，定义产品的属性。

```kotlin
class Product(
    val property1: String,
    val property2: Int,
    val property3: Boolean
) {
    // 可以在产品类中定义其他方法
}
```

2. 创建一个建造者类，用于构建产品对象。

```kotlin
class ProductBuilder {
    private var property1: String = ""
    private var property2: Int = 0
    private var property3: Boolean = false

    fun setProperty1(property1: String): ProductBuilder {
        this.property1 = property1
        return this
    }

    fun setProperty2(property2: Int): ProductBuilder {
        this.property2 = property2
        return this
    }

    fun setProperty3(property3: Boolean): ProductBuilder {
        this.property3 = property3
        return this
    }

    fun build(): Product {
        return Product(property1, property2, property3)
    }
}
```

3. 在客户端代码中使用建造者模式构建产品对象。

```kotlin
fun main() {
    val product = ProductBuilder()
        .setProperty1("Property 1")
        .setProperty2(123)
        .setProperty3(true)
        .build()

    // 使用构建的产品对象
    println(product.property1) // 输出：Property 1
    println(product.property2) // 输出：123
    println(product.property3) // 输出：true
}
```

在上面的示例中，我们创建了一个产品类 `Product`，它具有一些属性。然后我们创建了一个建造者类 `ProductBuilder`，该类具有与产品类属性对应的一些设置方法，以及一个 `build()` 方法用于构建产品对象。

在客户端代码中，我们使用建造者模式创建一个 `ProductBuilder` 对象，并使用连续的方法调用设置产品属性。最后，我们通过调用 `build()` 方法获得构建的产品对象。

通过建造者模式，我们可以以一种流畅的方式构建复杂的对象，并灵活地设置属性。它提供了一种可读性强、易于扩展的方式来构建对象，尤其适用于构建具有多个可选属性或复杂构造逻辑的对象。

## 1.5. 原型模式（Prototype Pattern）

在 Kotlin 中实现原型模式（Prototype Pattern），可以按照以下步骤进行操作：

1. 创建一个实现 Cloneable 接口的原型基类。

```kotlin
abstract class Prototype : Cloneable {
    abstract fun clone(): Prototype
}
```

2. 创建具体的原型类，并实现 clone() 方法。

```kotlin
class ConcretePrototypeA(private val property: String) : Prototype() {
    override fun clone(): Prototype {
        return ConcretePrototypeA(property)
    }

    fun getProperty(): String {
        return property
    }
}

class ConcretePrototypeB(private val property: Int) : Prototype() {
    override fun clone(): Prototype {
        return ConcretePrototypeB(property)
    }

    fun getProperty(): Int {
        return property
    }
}
```

3. 在客户端代码中使用原型模式创建对象。

```kotlin
fun main() {
    // 创建原型对象
    val prototypeA = ConcretePrototypeA("Property A")
    val prototypeB = ConcretePrototypeB(123)

    // 克隆原型对象
    val cloneA = prototypeA.clone() as ConcretePrototypeA
    val cloneB = prototypeB.clone() as ConcretePrototypeB

    // 验证克隆后的对象
    println(cloneA.getProperty()) // 输出：Property A
    println(cloneB.getProperty()) // 输出：123
}
```

在上面的示例中，我们创建了一个抽象基类 `Prototype`，该基类实现了 `Cloneable` 接口，并声明了一个抽象方法 `clone()`。然后我们创建了具体的原型类 `ConcretePrototypeA` 和 `ConcretePrototypeB`，它们分别继承了 `Prototype` 并实现了 `clone()` 方法。每个具体原型类都定义了一些特定的属性和方法。

在客户端代码中，我们创建了原型对象 `prototypeA` 和 `prototypeB`，然后使用原型对象的 `clone()` 方法创建了克隆对象 `cloneA` 和 `cloneB`。我们验证了克隆对象的属性是否正确。

通过原型模式，我们可以通过复制现有对象来创建新的对象，而无需依赖于具体类的实例化。这样可以避免重复的对象创建过程，并提高性能。

### 1.5.1. 原型模式的使用场景有哪些？
1. 资源优化场景。
2. 类初始化需要消化非常多的资源，这个资源包括数据、硬件资源等。 
3. 性能和安全要求的场景。 
4. 通过 new 产生一个对象需要非常繁琐的数据准备或访问权限，则可以使用原型模式。 
5. 一个对象多个修改者的场景。 
6. 一个对象需要提供给其他对象访问，而且各个调用者可能都需要修改其值时，可以考虑使用原型模式拷贝多个对象供调用者使用。 
7. 在实际项目中，原型模式很少单独出现，一般是和工厂方法模式一起出现，通过 clone 的方法创建一个对象，然后由工厂方法提供给调用者。原型模式已经与 Java 融为浑然一体，大家可以随手拿来使用。

# 2. 结构型模型（Structural Patterns）

## 2.1. 适配器模式（Adapter Pattern）
适配器模式（Adapter Pattern）是作为两个不兼容的接口之间的桥梁。主要解决在软件系统中，常常要将一些"现存的对象"放到新的环境中，而新环境要求的接口是现对象不能满足的。
> 将一个类的接口转换成客户希望的另外一个接口，使得原本由于接口不兼容而不能一起工作的那些类可以一起工作。

在 Kotlin 中实现适配器模式（Adapter Pattern），可以按照以下步骤进行操作：

1. 创建目标接口，即客户端期望的接口。

```kotlin
interface Target {
    fun request()
}
```

2. 创建适配者类，即需要被适配的类。

```kotlin
class Adaptee {
    fun specificRequest() {
        println("Adaptee: Specific Request")
    }
}
```

3. 创建适配器类，实现目标接口，并在适配器中使用适配者类。

> 持有适配者类的实例，调用老方法实现新接口

```kotlin
class Adapter(private val adaptee: Adaptee) : Target {
    override fun request() {
        adaptee.specificRequest()
    }
}
```

4. 在客户端代码中使用适配器模式。

> 在使用适配者的地方改为调用 Adapter 类

```kotlin
fun main() {
    val adaptee = Adaptee()
    val adapter: Target = Adapter(adaptee)
    
    adapter.request()
}
```
适配器模式允许我们在不修改现有类的情况下适应不兼容的接口。适配器作为中间层，将客户端的请求转发给适配者类。这样，客户端代码可以与目标接口交互，而不需要直接与适配者类进行交互。这提高了代码的灵活性和可维护性。

## 2.2. 桥接模式（Bridge Pattern）

> 将抽象部分与它的实现部分分离，使它们都可以独立地变化。

以下关于桥接模式的示例来自[廖雪峰的官方网站](https://www.liaoxuefeng.com/wiki/1252599548343744/1281319266943009)

假设某个汽车厂商生产三种品牌的汽车：Big、Tiny 和 Boss，每种品牌又可以选择燃油、纯电和混合动力。如果用传统的继承来表示各个最终车型，一共有 3 个抽象类加 9 个最终子类：

```
                   ┌───────┐
                   │  Car  │
                   └───────┘
                       ▲
    ┌──────────────────┼───────────────────┐
    │                  │                   │
┌───────┐          ┌───────┐          ┌───────┐
│BigCar │          │TinyCar│          │BossCar│
└───────┘          └───────┘          └───────┘
    ▲                  ▲                  ▲
    │                  │                  │
    │ ┌───────────────┐│ ┌───────────────┐│ ┌───────────────┐
    ├─│  BigFuelCar   │├─│  TinyFuelCar  │├─│  BossFuelCar  │
    │ └───────────────┘│ └───────────────┘│ └───────────────┘
    │ ┌───────────────┐│ ┌───────────────┐│ ┌───────────────┐
    ├─│BigElectricCar │├─│TinyElectricCar│├─│BossElectricCar│
    │ └───────────────┘│ └───────────────┘│ └───────────────┘
    │ ┌───────────────┐│ ┌───────────────┐│ ┌───────────────┐
    └─│ BigHybridCar  │└─│ TinyHybridCar │└─│ BossHybridCar │
      └───────────────┘  └───────────────┘  └───────────────┘
```

如果要新增一个品牌，或者加一个新的引擎（比如核动力），那么子类的数量增长更快。

所以，桥接模式就是为了避免直接继承带来的子类爆炸。

我们来看看桥接模式如何解决上述问题。

在桥接模式中，首先把 Car 按品牌进行子类化，但是，每个品牌选择什么发动机，不再使用子类扩充，而是通过一个抽象的“修正”类，以组合的形式引入。我们来看看具体的实现。

首先定义抽象类 Car，它引用一个 Engine：

```java
public abstract class Car {
    // 引用 Engine:
    protected Engine engine;

    public Car(Engine engine) {
        this.engine = engine;
    }

    public abstract void drive();
}
```

Engine 的定义如下：

```java
public interface Engine {
    void start();
}
```

紧接着，在一个“修正”的抽象类 RefinedCar 中定义一些额外操作：

```java
public abstract class RefinedCar extends Car {
    public RefinedCar(Engine engine) {
        super(engine);
    }

    public void drive() {
        this.engine.start();
        System.out.println("Drive " + getBrand() + " car...");
    }

    public abstract String getBrand();
}
```

这样一来，最终的不同品牌继承自 RefinedCar，例如 BossCar：

```java
public class BossCar extends RefinedCar {
    public BossCar(Engine engine) {
        super(engine);
    }

    public String getBrand() {
        return "Boss";
    }
}
```
而针对每一种引擎，继承自 Engine，例如 HybridEngine：

```java
public class HybridEngine implements Engine {
    public void start() {
        System.out.println("Start Hybrid Engine...");
    }
}
```

客户端通过自己选择一个品牌，再配合一种引擎，得到最终的 Car：

```java
RefinedCar car = new BossCar(new HybridEngine());
car.drive();
```
```
       ┌───────────┐
       │    Car    │
       └───────────┘
             ▲
             │
       ┌───────────┐       ┌─────────┐
       │RefinedCar │ ─ ─ ─>│ Engine  │
       └───────────┘       └─────────┘
             ▲                  ▲
    ┌────────┼────────┐         │ ┌──────────────┐
    │        │        │         ├─│  FuelEngine  │
┌───────┐┌───────┐┌───────┐     │ └──────────────┘
│BigCar ││TinyCar││BossCar│     │ ┌──────────────┐
└───────┘└───────┘└───────┘     ├─│ElectricEngine│
                                │ └──────────────┘
                                │ ┌──────────────┐
                                └─│ HybridEngine │
                                  └──────────────┘
```

使用桥接模式的好处在于，如果要增加一种引擎，只需要针对 Engine 派生一个新的子类，如果要增加一个品牌，只需要针对 RefinedCar 派生一个子类，任何 RefinedCar 的子类都可以和任何一种 Engine 自由组合，即一辆汽车的两个维度：品牌和引擎都可以独立地变化。

## 2.3. 装饰器模式（Decorator Pattern）
装饰器模式（Decorator Pattern）是一种结构型设计模式，它允许在不改变现有对象结构的情况下，动态地将行为附加到对象上。装饰器模式通过将对象包装在一个装饰器类中，以提供额外的功能或修改现有功能的方式来扩展对象的行为。

装饰器模式遵循开放封闭原则，即可以添加新的装饰器类来扩展功能，而无需修改已有的代码。这使得装饰器模式具有灵活性和可扩展性，并且可以动态地组合多个装饰器，以实现各种组合效果。

以下关于装饰器模式的示例来自[廖雪峰的官方网站](https://www.liaoxuefeng.com/wiki/1252599548343744/1281319302594594)

在 Java 标准库中，`InputStream` 是抽象类，`FileInputStream`、`ServletInputStream`、`Socket.getInputStream()` 这些 `InputStream` 都是最终数据源。现在，如果要给不同的最终数据源增加缓冲功能、计算签名功能、加密解密功能，那么，3 个最终数据源、3 种功能一共需要 9 个子类。如果继续增加最终数据源，或者增加新功能，子类会爆炸式增长，这种设计方式显然是不可取的。Decorator 模式的目的就是把一个一个的附加功能，用 Decorator 的方式给一层一层地累加到原始数据源上，最终，通过组合获得我们想要的功能。

例如：给 `FileInputStream` 增加缓冲和解压缩功能，用 Decorator 模式写出来如下：

```java
// 创建原始的数据源：
InputStream fis = new FileInputStream("test.gz");
// 增加缓冲功能：
InputStream bis = new BufferedInputStream(fis);
// 增加解压缩功能：
InputStream gis = new GZIPInputStream(bis);
```

或者一次性写成这样：

```java
InputStream input = new GZIPInputStream( // 第二层装饰
                        new BufferedInputStream( // 第一层装饰
                            new FileInputStream("test.gz") // 核心功能
                        ));
```
观察 `BufferedInputStream` 和 `GZIPInputStream`，它们实际上都是从 `FileInputStream` 继承的，这个 `FileInputStream` 就是一个抽象的 Decorator。我们用图把 Decorator 模式画出来如下：
```
             ┌───────────┐
             │ Component │
             └───────────┘
                   ▲
      ┌────────────┼─────────────────┐
      │            │                 │
┌───────────┐┌───────────┐     ┌───────────┐
│ComponentA ││ComponentB │...  │ Decorator │
└───────────┘└───────────┘     └───────────┘
                                     ▲
                              ┌──────┴──────┐
                              │             │
                        ┌───────────┐ ┌───────────┐
                        │DecoratorA │ │DecoratorB │...
                        └───────────┘ └───────────┘
```

## 2.4. 组合模式（Composite Pattern）

组合模式（Composite Pattern）是一种结构型设计模式，它允许我们将对象组合成树状结构，并以统一的方式处理单个对象和组合对象。组合模式通过定义一个共同的接口，使得单个对象和组合对象可以被一致地使用。

组合模式包含以下几个关键角色：

组件（Component）：定义组合对象和叶节点对象的共同接口，可以提供默认的实现或抽象方法。

叶节点（Leaf）：表示组合中的叶节点对象，没有子节点。实现组件接口并提供具体实现。

组合节点（Composite）：表示组合中的组合对象，可以包含子节点。实现组件接口并提供添加、移除和获取子节点的方法。

通过使用组合模式，我们可以以一致的方式处理单个对象和组合对象，从而简化了客户端代码。组合模式适用于以下情况：

当希望将对象组织成树状结构，并以统一的方式处理组合对象和单个对象时。

当希望客户端能够忽略组合对象和单个对象之间的差异，统一调用它们的方法时。

当希望添加新类型的组件而无需更改现有代码时，即遵循开放封闭原则。

```kotlin
// 组件接口
interface Component {
    fun operation()
}

// 叶节点
class Leaf(private val name: String) : Component {
    override fun operation() {
        println("Leaf: $name")
    }
}

// 组合节点
class Composite(private val name: String) : Component {
    private val children = mutableListOf<Component>()

    fun add(component: Component) {
        children.add(component)
    }

    fun remove(component: Component) {
        children.remove(component)
    }

    override fun operation() {
        println("Composite: $name")
        for (child in children) {
            child.operation()
        }
    }
}

// 客户端代码
fun main() {
    val root = Composite("Root")
    val branch1 = Composite("Branch 1")
    val branch2 = Composite("Branch 2")
    val leaf1 = Leaf("Leaf 1")
    val leaf2 = Leaf("Leaf 2")
    val leaf3 = Leaf("Leaf 3")

    root.add(branch1)
    root.add(branch2)
    branch1.add(leaf1)
    branch2.add(leaf2)
    branch2.add(leaf3)

    root.operation()
}
```

## 2.5. 外观模式（Facade Pattern）
外观模式（Facade Pattern）是一种结构型设计模式，它提供了一个统一的接口，用于访问子系统中的一组接口。外观模式隐藏了子系统的复杂性，为客户端提供了一个简单的接口，使得客户端与子系统之间的交互更加方便和易于使用。

外观模式涉及以下几个关键角色：

外观（Facade）：提供了一个简单的接口，客户端通过该接口与子系统进行交互。外观对象知道如何将客户端的请求委派给适当的子系统对象。

子系统（Subsystem）：包含了一组相关的类或接口，负责实现子系统的功能。外观模式并不限制子系统的结构，可以是一个复杂的子系统，也可以是一组松散耦合的类。

客户端（Client）：通过外观对象来与子系统进行交互，而不需要直接与子系统中的类进行交互。

以下外观模式的示例来自[廖雪峰的官方网站](https://www.liaoxuefeng.com/wiki/1252599548343744/1281319346634785)

以注册公司为例，假设注册公司需要三步：

向工商局申请公司营业执照；
在银行开设账户；
在税务局开设纳税号。
以下是三个系统的接口：

```java
// 工商注册：
public class AdminOfIndustry {
    public Company register(String name) {
        ...
    }
}

// 银行开户：
public class Bank {
    public String openAccount(String companyId) {
        ...
    }
}

// 纳税登记：
public class Taxation {
    public String applyTaxCode(String companyId) {
        ...
    }
}
```

如果子系统比较复杂，并且客户对流程也不熟悉，那就把这些流程全部委托给中介：

```java
public class Facade {
    public Company openCompany(String name) {
        Company c = this.admin.register(name);
        String bankAccount = this.bank.openAccount(c.getId());
        c.setBankAccount(bankAccount);
        String taxCode = this.taxation.applyTaxCode(c.getId());
        c.setTaxCode(taxCode);
        return c;
    }
}
```
这样，客户端只跟 Facade 打交道，一次完成公司注册的所有繁琐流程：

`Company c = facade.openCompany("Facade Software Ltd.");`

很多 Web 程序，内部有多个子系统提供服务，经常使用一个统一的 Facade 入口，例如一个 RestApiController，使得外部用户调用的时候，只关心 Facade 提供的接口，不用管内部到底是哪个子系统处理的。

更复杂的 Web 程序，会有多个 Web 服务，这个时候，经常会使用一个统一的网关入口来自动转发到不同的 Web 服务，这种提供统一入口的网关就是 Gateway，它本质上也是一个 Facade，但可以附加一些用户认证、限流限速的额外服务。

## 2.6. 享元模式（Flyweight Pattern）

享元模式（Flyweight Pattern）是一种结构型设计模式，旨在通过共享对象来有效地支持大量细粒度的对象。享元模式通过共享相同或相似的对象，减少了内存使用和对象创建的开销。享元（Flyweight）的核心思想很简单：如果一个对象实例**一经创建就不可变**，那么反复创建相同的实例就没有必要，直接向调用方返回一个共享的实例就行，这样即节省内存，又可以减少创建对象的过程，提高运行速度。

享元模式涉及以下几个关键角色：

1. 享元（Flyweight）：表示共享对象的接口，定义了对象的外部状态和内部状态的操作方法。

2. 具体享元（Concrete Flyweight）：实现享元接口，并可共享的具体对象。

3. 享元工厂（Flyweight Factory）：负责创建和管理享元对象，维护一个享元池（Flyweight Pool）来存储已创建的享元对象。

下面是使用 Java 语言编写的享元模式示例代码：

```java
import java.util.HashMap;
import java.util.Map;

// 享元接口
interface Shape {
    void draw();
}

// 具体享元类
class Circle implements Shape {
    private String color;

    public Circle(String color) {
        this.color = color;
    }

    @Override
    public void draw() {
        System.out.println("Drawing a circle with color: " + color);
    }
}

// 享元工厂类
class ShapeFactory {
    private static final Map<String, Shape> shapeCache = new HashMap<>();

    public static Shape getCircle(String color) {
        Circle circle = (Circle) shapeCache.get(color);

        if (circle == null) {
            circle = new Circle(color);
            shapeCache.put(color, circle);
        }

        return circle;
    }
}

// 客户端代码
public class Main {
    private static final String[] colors = {"Red", "Green", "Blue", "Yellow"};

    public static void main(String[] args) {
        for (int i = 0; i < 10; i++) {
            Circle circle = (Circle) ShapeFactory.getCircle(getRandomColor());
            circle.draw();
        }
    }

    private static String getRandomColor() {
        return colors[(int) (Math.random() * colors.length)];
    }
}
```

## 2.7. 代理模式（Proxy Pattern）
代理模式是一种结构型设计模式，让你能够提供对象的替代品或其占位符。代理控制着对于原对象的访问，并允许在将请求提交给对象前后进行一些处理。

以下示例来自[refactoringguru](https://refactoringguru.cn/design-patterns/proxy)

为什么要控制对于某个对象的访问呢？举个例子：有这样一个消耗大量系统资源的巨型对象，你只是偶尔需要使用它，并非总是需要。

- 代理模式解决的问题
数据库查询有可能会非常缓慢。
你可以实现延迟初始化：在实际有需要时再创建该对象。对象的所有客户端都要执行延迟初始代码。不幸的是，这很可能会带来很多重复代码。

在理想情况下，我们希望将代码直接放入对象的类中，但这并非总是能实现：比如类可能是第三方封闭库的一部分。

- 解决方案
代理模式建议新建一个与原服务对象接口相同的代理类，然后更新应用以将代理对象传递给所有原始对象客户端。代理类接收到客户端请求后会创建实际的服务对象，并将所有工作委派给它。
这有什么好处呢？如果需要在类的主要业务逻辑前后执行一些工作，你无需修改类就能完成这项工作。由于代理实现的接口与原类相同，因此你可将其传递给任何一个使用实际服务对象的客户端。

# 3. 行为型模式（Behavioral Patterns）:
## 3.1. 模板方法模式（Template Method Pattern）

模板方法模式（Template Method Pattern）是一种行为型设计模式，它定义了一个操作中的算法骨架，而将一些步骤延迟到子类中实现。模板方法模式使得子类可以在不改变算法结构的情况下，重新定义算法中的某些步骤。

模板方法模式涉及以下几个关键角色：

1. 抽象类（Abstract Class）：定义了一个模板方法，其中包含了算法的骨架和一些抽象方法，用于延迟到子类中实现。

2. 具体类（Concrete Class）：继承抽象类，并实现其中的抽象方法，完成算法中的具体步骤。

下面是使用 Kotlin 语言编写的模板方法模式示例代码：

```kotlin
// 抽象类
abstract class Game {
    abstract fun initialize()
    abstract fun startPlay()
    abstract fun endPlay()

    // 模板方法，定义了算法的骨架
    fun play() {
        initialize()
        startPlay()
        endPlay()
    }
}

// 具体类
class Football : Game() {
    override fun initialize() {
        println("Football Game Initialized! Start playing.")
    }

    override fun startPlay() {
        println("Football Game Started. Enjoy the game!")
    }

    override fun endPlay() {
        println("Football Game Finished!")
    }
}

class Basketball : Game() {
    override fun initialize() {
        println("Basketball Game Initialized! Start playing.")
    }

    override fun startPlay() {
        println("Basketball Game Started. Enjoy the game!")
    }

    override fun endPlay() {
        println("Basketball Game Finished!")
    }
}

// 客户端代码
fun main() {
    val footballGame = Football()
    footballGame.play()

    println()

    val basketballGame = Basketball()
    basketballGame.play()
}
```

在上述示例中，我们定义了抽象类 `Game`，其中包含了模板方法 `play()`，以及抽象方法 `initialize()`、`startPlay()` 和 `endPlay()`。

然后我们创建了具体类 `Football` 和 `Basketball`，它们继承自抽象类并实现了其中的抽象方法。

在客户端代码中，我们创建了一个足球游戏对象 `footballGame` 和一个篮球游戏对象 `basketballGame`，并调用它们的 `play()` 方法。模板方法 `play()` 中定义了算法的骨架，包括了初始化、开始游戏和结束游戏的步骤，具体的实现则由子类提供。

运行上述代码将输出：

```
Football Game Initialized! Start playing.
Football Game Started. Enjoy the game!
Football Game Finished!

Basketball Game Initialized! Start playing.
Basketball Game Started. Enjoy the game!
Basketball Game Finished!
```

通过使用模板方法模式，我们可以定义算法的骨架，并将一些具体步骤延迟到子类中实现。这样，不同的子类可以根据自己的需求来定制算法。

可见，模板方法的核心思想是：父类定义骨架，子类实现某些细节。

为了防止子类重写父类的骨架方法，可以在父类中对骨架方法使用 final。对于需要子类实现的抽象方法，一般声明为 protected，使得这些方法对外部客户端不可见。

## 3.2. 策略模式（Strategy Pattern）

策略模式（Strategy Pattern）是一种行为型设计模式，它定义了一系列算法，将每个算法封装成独立的对象，并使它们可以互相替换。策略模式使得算法的变化独立于使用它的客户端。

策略模式涉及以下几个关键角色：

1. 策略（Strategy）：定义了算法的接口，具体的策略类实现该接口，提供了不同的算法实现。

2. 具体策略（Concrete Strategy）：实现了策略接口，提供了具体的算法实现。

3. 上下文（Context）：持有一个策略对象的引用，并在需要的时候调用策略的算法。

下面是使用 Kotlin 语言编写的策略模式示例代码：

```kotlin
// 策略接口
interface SortStrategy {
    fun sort(list: List<Int>): List<Int>
}

// 具体策略：冒泡排序
class BubbleSortStrategy : SortStrategy {
    override fun sort(list: List<Int>): List<Int> {
        println("Using Bubble Sort")
        val sortedList = list.toMutableList()
        val n = sortedList.size
        for (i in 0 until n - 1) {
            for (j in 0 until n - i - 1) {
                if (sortedList[j] > sortedList[j + 1]) {
                    val temp = sortedList[j]
                    sortedList[j] = sortedList[j + 1]
                    sortedList[j + 1] = temp
                }
            }
        }
        return sortedList
    }
}

// 具体策略：快速排序
class QuickSortStrategy : SortStrategy {
    override fun sort(list: List<Int>): List<Int> {
        println("Using Quick Sort")
        if (list.size <= 1) return list
        val pivot = list[list.size / 2]
        val equal = list.filter { it == pivot }
        val less = list.filter { it < pivot }
        val greater = list.filter { it > pivot }
        return sort(less) + equal + sort(greater)
    }
}

// 上下文
class SortContext(private val strategy: SortStrategy) {
    fun sortList(list: List<Int>): List<Int> {
        return strategy.sort(list)
    }
}

// 客户端代码
fun main() {
    val list = listOf(5, 2, 8, 4, 1)

    val bubbleSortStrategy = BubbleSortStrategy()
    val bubbleSortContext = SortContext(bubbleSortStrategy)
    val bubbleSortedList = bubbleSortContext.sortList(list)
    println("Bubble Sorted List: $bubbleSortedList")

    println()

    val quickSortStrategy = QuickSortStrategy()
    val quickSortContext = SortContext(quickSortStrategy)
    val quickSortedList = quickSortContext.sortList(list)
    println("Quick Sorted List: $quickSortedList")
}
```

在上述示例中，我们定义了一个策略接口 `SortStrategy`，其中包含了一个 `sort()` 方法用于排序。

然后我们创建了两个具体策略类 `BubbleSortStrategy` 和 `QuickSortStrategy`，

它们分别实现了 `SortStrategy` 接口，并提供了不同的排序算法实现。

接下来，我们创建了上下文类 `SortContext`，它持有一个策略对象的引用，并在需要时调用策略的 `sort()` 方法。

在客户端代码中，我们创建了一个整数列表 `list`，然后使用冒泡排序策略和快速排序策略对列表进行排序。我们通过创建相应的策略对象，并将其传递给上下文类的构造函数，然后调用 `sortList()` 方法进行排序，并打印排序后的结果。

运行上述代码将输出：

```
Using Bubble Sort
Bubble Sorted List: [1, 2, 4, 5, 8]

Using Quick Sort
Quick Sorted List: [1, 2, 4, 5, 8]
```

通过使用策略模式，我们可以轻松地在运行时选择不同的算法，使得算法的变化独立于客户端的使用。

## 3.3. 观察者模式（Observer Pattern）

观察者模式（Observer Pattern）是一种行为型设计模式，它定义了一种一对多的依赖关系，让多个观察者对象同时监听某一个主题对象的状态变化。当主题对象发生变化时，它的所有观察者都会收到通知并进行相应的更新。

观察者模式涉及以下几个关键角色：

1. 主题（Subject）：也称为被观察者或可观察者，它维护一份观察者列表并提供注册和删除观察者的方法，以及通知观察者的方法。

2. 观察者（Observer）：定义了一个更新的接口，用于接收主题的通知并进行相应的更新操作。

3. 具体主题（Concrete Subject）：继承或实现主题接口，具体主题对象通常在自身状态发生变化时，通知所有注册的观察者。

4. 具体观察者（Concrete Observer）：继承或实现观察者接口，在接收到主题的通知时进行相应的更新操作。

下面是使用 Kotlin 语言编写的观察者模式示例代码：

```kotlin
// 主题接口
interface Subject {
    fun registerObserver(observer: Observer)
    fun removeObserver(observer: Observer)
    fun notifyObservers()
}

// 观察者接口
interface Observer {
    fun update(subject: Subject)
}

// 具体主题
class WeatherData : Subject {
    private val observers: MutableList<Observer> = mutableListOf()
    private var temperature: Float = 0.0f

    fun setTemperature(temperature: Float) {
        this.temperature = temperature
        notifyObservers()
    }

    override fun registerObserver(observer: Observer) {
        observers.add(observer)
    }

    override fun removeObserver(observer: Observer) {
        observers.remove(observer)
    }

    override fun notifyObservers() {
        for (observer in observers) {
            observer.update(this)
        }
    }

    fun getTemperature(): Float {
        return temperature
    }
}

// 具体观察者
class Display : Observer {
    override fun update(subject: Subject) {
        if (subject is WeatherData) {
            val temperature = subject.getTemperature()
            println("Temperature updated: $temperature")
            // 具体的更新操作
        }
    }
}

// 客户端代码
fun main() {
    val weatherData = WeatherData()
    val display = Display()

    weatherData.registerObserver(display)

    // 模拟温度变化
    weatherData.setTemperature(25.0f)
    weatherData.setTemperature(30.0f)

    weatherData.removeObserver(display)

    // 不再通知已移除的观察者
    weatherData.setTemperature(28.0f)
}
```

在上述示例中，我们定义了主题接口 `Subject` 和观察者接口 `Observer`，其中主题接口包含了注册、删除和通知观察者的方法，观察者接口定义了一个更新的方法。

然后我们创建了具体主题类 `WeatherData`

，它维护了一个观察者列表，并在温度发生变化时通知所有注册的观察者。

接下来，我们创建了具体观察者类 `Display`，它实现了观察者接口，并在接收到主题通知时进行相应的更新操作。

在客户端代码中，我们创建了一个主题对象 `weatherData` 和一个观察者对象 `display`，并将观察者注册到主题中。然后模拟温度变化，并通过调用主题的 `setTemperature()` 方法来触发通知。

运行上述代码将输出：

```
Temperature updated: 25.0
Temperature updated: 30.0
```

通过使用观察者模式，我们实现了主题和观察者之间的解耦，主题对象可以在不知道具体观察者的情况下通知观察者，而观察者也可以自由地注册、删除和更新，从而实现了松耦合的设计。

## 3.4. 迭代器模式（Iterator Pattern）

迭代器模式是一种行为设计模式，让你能在不暴露集合底层表现形式（列表、栈和树等）的情况下遍历集合中所有的元素。

- 实现方式

1. 声明迭代器接口。该接口必须提供至少一个方法来获取集合中的下个元素。但为了使用方便，你还可以添加一些其他方法，例如获取前一个元素、记录当前位置和判断迭代是否已结束。

2. 声明集合接口并描述一个获取迭代器的方法。其返回值必须是迭代器接口。如果你计划拥有多组不同的迭代器，则可以声明多个类似的方法。

3. 为希望使用迭代器进行遍历的集合实现具体迭代器类。迭代器对象必须与单个集合实体链接。链接关系通常通过迭代器的构造函数建立。

4. 在你的集合类中实现集合接口。其主要思想是针对特定集合为客户端代码提供创建迭代器的快捷方式。集合对象必须将自身传递给迭代器的构造函数来创建两者之间的链接。

5. 检查客户端代码，使用迭代器替代所有集合遍历代码。每当客户端需要遍历集合元素时都会获取一个新的迭代器。

```kotlin
// 迭代器接口
interface Iterator<T> {
    fun hasNext(): Boolean
    fun next(): T
}

// 聚合对象接口
interface Aggregate<T> {
    fun createIterator(): Iterator<T>
}

// 具体迭代器
class ListIterator<T>(private val list: List<T>) : Iterator<T> {
    private var currentIndex: Int = 0

    override fun hasNext(): Boolean {
        return currentIndex < list.size
    }

    override fun next(): T {
        return if (hasNext()) {
            val item = list[currentIndex]
            currentIndex++
            item
        } else {
            throw NoSuchElementException()
        }
    }
}

// 具体聚合对象
class MyList<T>(private val items: MutableList<T> = mutableListOf()) : Aggregate<T> {
    fun add(item: T) {
        items.add(item)
    }

    fun remove(item: T) {
        items.remove(item)
    }

    fun getItem(index: Int): T {
        return items[index]
    }

    fun size(): Int {
        return items.size
    }

    override fun createIterator(): Iterator<T> {
        return ListIterator(items)
    }
}

// 客户端代码
fun main() {
    val myList = MyList<Int>()
    myList.add(1)
    myList.add(2)
    myList.add(3)

    val iterator = myList.createIterator()

    while (iterator.hasNext()) {
        val item = iterator.next()
        println(item)
    }
}
```

## 3.5. 命令模式（Command Pattern）
命令模式是一种行为设计模式，它可将请求转换为一个包含与请求相关的所有信息的独立对象。该转换让你能根据不同的请求将方法参数化、延迟请求执行或将其放入队列中，且能实现可撤销操作。

以下示例来自 [Refactoring GURU](https://refactoringguru.cn/design-patterns/command)

假如你正在开发一款新的文字编辑器，当前的任务是创建一个包含多个按钮的工具栏，并让每个按钮对应编辑器的不同操作。你创建了一个非常简洁的 按钮类，它不仅可用于生成工具栏上的按钮，还可用于生成各种对话框的通用按钮。

![应用中的所有按钮都可以继承相同的类](/assets/images/problem1-2x.png)

尽管所有按钮看上去都很相似，但它们可以完成不同的操作（打开、保存、打印和应用等）。你会在哪里放置这些按钮的点击处理代码呢？最简单的解决方案是在使用按钮的每个地方都创建大量的子类。这些子类中包含按钮点击后必须执行的代码。

![大量的按钮子类](/assets/images/problem2-2x.png)

你很快就意识到这种方式有严重缺陷。首先，你创建了大量的子类，当每次修改基类 按钮时，你都有可能需要修改所有子类的代码。简单来说，GUI 代码以一种拙劣的方式依赖于业务逻辑中的不稳定代码。

![多个类实现同一功能](/assets/images/problem3-zh-2x.png)

还有一个部分最难办。复制/粘贴文字等操作可能会在多个地方被调用。例如用户可以点击工具栏上小小的“复制”按钮，或者通过上下文菜单复制一些内容，又或者直接使用键盘上的 Ctrl+C。

我们的程序最初只有工具栏，因此可以使用按钮子类来实现各种不同操作。换句话来说，复制按钮 Copy­Button 子类包含复制文字的代码是可行的。在实现了上下文菜单、快捷方式和其他功能后，你要么需要将操作代码复制进许多个类中，要么需要让菜单依赖于按钮，而后者是更糟糕的选择。

**解决方案**

优秀的软件设计通常会将关注点进行分离，而这往往会导致软件的分层。最常见的例子：一层负责用户图像界面；另一层负责业务逻辑。GUI 层负责在屏幕上渲染美观的图形，捕获所有输入并显示用户和程序工作的结果。当需要完成一些重要内容时（比如计算月球轨道或撰写年度报告），GUI 层则会将工作委派给业务逻辑底层。

这在代码中看上去就像这样：一个 GUI 对象传递一些参数来调用一个业务逻辑对象。这个过程通常被描述为一个对象发送请求给另一个对象。

![GUI 层可以直接访问业务逻辑层。](/assets/images/solution1-zh-2x.png)

命令模式建议 GUI 对象不直接提交这些请求。你应该将请求的所有细节（例如调用的对象、方法名称和参数列表）抽取出来组成命令类，该类中仅包含一个用于触发请求的方法。

命令对象负责连接不同的 GUI 和业务逻辑对象。此后，GUI 对象无需了解业务逻辑对象是否获得了请求，也无需了解其对请求进行处理的方式。GUI 对象触发命令即可，命令对象会自行处理所有细节工作。

![通过命令访问业务逻辑层](/assets/images/solution2-zh-2x.png)

下一步是让所有命令实现相同的接口。该接口通常只有一个没有任何参数的执行方法，让你能在不和具体命令类耦合的情况下使用同一请求发送者执行不同命令。

![GUI 对象将命令委派给命令对象](/assets/images/solution3-zh-2x.png)

**命令模式适合应用场景**

- 如果你需要通过操作来参数化对象，可使用命令模式。

 命令模式可将特定的方法调用转化为独立对象。这一改变也带来了许多有趣的应用：你可以将命令作为方法的参数进行传递、将命令保存在其他对象中，或者在运行时切换已连接的命令等。

举个例子：你正在开发一个 GUI 组件（例如上下文菜单），你希望用户能够配置菜单项，并在点击菜单项时触发操作。

- 如果你想要将操作放入队列中、操作的执行或者远程执行操作，可使用命令模式。

 同其他对象一样，命令也可以实现序列化（序列化的意思是转化为字符串），从而能方便地写入文件或数据库中。一段时间后，该字符串可被恢复成为最初的命令对象。因此，你可以延迟或计划命令的执行。但其功能远不止如此！使用同样的方式，你还可以将命令放入队列、记录命令或者通过网络发送命令。

- 如果你想要实现操作回滚功能，可使用命令模式。

 尽管有很多方法可以实现撤销和恢复功能，但命令模式可能是其中最常用的一种。

为了能够回滚操作，你需要实现已执行操作的历史记录功能。命令历史记录是一种包含所有已执行命令对象及其相关程序状态备份的栈结构。

这种方法有两个缺点。首先，程序状态的保存功能并不容易实现，因为部分状态可能是私有的。你可以使用备忘录模式来在一定程度上解决这个问题。

其次，备份状态可能会占用大量内存。因此，有时你需要借助另一种实现方式：命令无需恢复原始状态，而是执行反向操作。反向操作也有代价：它可能会很难甚至是无法实现。

## 3.6. 备忘录模式（Memento Pattern）
## 3.7. 解释器模式（Interpreter Pattern）
## 3.8. 状态模式（State Pattern）
## 3.9. 职责链模式（Chain of Responsibility Pattern）
## 3.10. 访问者模式（Visitor Pattern）
## 3.11. 中介者模式（Mediator Pattern）

# 4. 并发模式（Concurrency Patterns）:
## 4.1. 信号量模式（Semaphore Pattern）
## 4.2. 互斥锁模式（Mutex Pattern）
## 4.3. 生产者 - 消费者模式（Producer-Consumer Pattern）
## 4.4. 读者 - 写者模式（Reader-Writer Pattern）
## 4.5. 资源池模式（Resource Pool Pattern）

# 5. 架构模式（Architectural Patterns）:
## 5.1. MVC 模式（Model-View-Controller Pattern）
## 5.2. MVP 模式（Model-View-Presenter Pattern）
## 5.3. MVVM 模式（Model-View-ViewModel Pattern）
## 5.4. 责任分离模式（Separation of Concerns Pattern）
## 5.5. 依赖注入模式（Dependency Injection Pattern）
## 5.6. 服务定位器模式（Service Locator Pattern）
## 5.7. 事件驱动架构模式（Event-Driven Architecture Pattern）