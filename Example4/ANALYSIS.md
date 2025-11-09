# Exercise 4 - WAM (Web Audio Modules) Architecture

## 🎯 What is WAM?

WAM (Web Audio Modules) = **"VST for the Web"** - a plugin standard for Web Audio applications.

## 🔍 Key Architecture Features

### 1. **Separation of Concerns (MVC Pattern)**

```javascript
// Processing (Model)
connectPlugin(instance.audioNode);

// GUI (View)
const pluginDomNode = await instance.createGui();
mountPlugin(pluginDomNode);
```

- **GUI** and **Audio Processing** are completely separated
- Can update one without affecting the other

### 2. **Facade Pattern** ⭐ (Main Design Pattern)

```javascript
// Simple external interface
audioNode.connect(audioContext.destination);
```

**Externally**: Single AudioNode  
**Internally**: Complex graph with dozens of interconnected nodes (BufferSource, Gain, Filter, Analyser, Compressor, etc.)

**This hides complexity behind a simple interface!**

### 3. **Factory Pattern**

```javascript
const instance = await WAM.createInstance(hostGroupId, audioContext);
```

Creates and initializes complex objects with one method call.

### 4. **Plugin Architecture**

- Plugins are self-contained and reusable
- Loaded dynamically from URLs
- Multiple instances can coexist

## 🔄 Loading Process

1. Initialize WAM host
2. Import plugin from URL
3. Create instance
4. Connect audio node
5. Mount GUI

## 💡 Benefits

- ✅ Cross-platform (any browser)
- ✅ No installation required
- ✅ Reusable components
- ✅ Standardized interface
- ✅ Secure and sandboxed

## 🎓 Design Patterns Answer

**Q: Did this remind you of a Design Pattern?**

**A: Yes! The FACADE PATTERN**

- **Simple interface** (single audioNode)
- **Complex subsystem** hidden (internal audio graph)
- **Encapsulation** of complexity

Also uses: Factory, MVC, Module, and Plugin patterns.

**This architecture makes WAM plugins powerful and reusable!** 🚀
