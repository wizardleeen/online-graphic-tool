import { useState, useRef, useEffect, useCallback } from 'react'

const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 600

function App() {
  const canvasRef = useRef(null)
  const [shapes, setShapes] = useState([])
  const [selectedShape, setSelectedShape] = useState(null)
  const [currentTool, setCurrentTool] = useState('select')
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 })
  const [drawingShape, setDrawingShape] = useState(null)
  
  // 默认样式
  const [fillColor, setFillColor] = useState('#667eea')
  const [strokeColor, setStrokeColor] = useState('#333333')
  const [strokeWidth, setStrokeWidth] = useState(2)
  const [textContent, setTextContent] = useState('双击编辑文字')
  const [fontSize, setFontSize] = useState(24)
  
  // 拖拽状态
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)

  // 初始化画布
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  }, [])

  // 绘制所有形状
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    // 清空画布
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    
    // 绘制所有形状
    shapes.forEach(shape => {
      drawShape(ctx, shape)
    })
    
    // 绘制当前正在绘制的形状
    if (drawingShape) {
      drawShape(ctx, drawingShape)
    }
    
    // 绘制选中边框
    if (selectedShape) {
      const shape = shapes.find(s => s.id === selectedShape)
      if (shape) {
        ctx.strokeStyle = '#667eea'
        ctx.lineWidth = 2
        ctx.setLineDash([5, 5])
        
        let bounds = getShapeBounds(shape)
        ctx.strokeRect(bounds.x - 5, bounds.y - 5, bounds.width + 10, bounds.height + 10)
        ctx.setLineDash([])
      }
    }
  }, [shapes, drawingShape, selectedShape])

  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

  // 绘制单个形状
  const drawShape = (ctx, shape) => {
    ctx.fillStyle = shape.fillColor
    ctx.strokeStyle = shape.strokeColor
    ctx.lineWidth = shape.strokeWidth
    
    switch (shape.type) {
      case 'rectangle':
        ctx.beginPath()
        ctx.rect(shape.x, shape.y, shape.width, shape.height)
        ctx.fill()
        ctx.stroke()
        break
        
      case 'circle':
        ctx.beginPath()
        const radiusX = Math.abs(shape.width) / 2
        const radiusY = Math.abs(shape.height) / 2
        const centerX = shape.x + shape.width / 2
        const centerY = shape.y + shape.height / 2
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
        break
        
      case 'triangle':
        ctx.beginPath()
        ctx.moveTo(shape.x + shape.width / 2, shape.y)
        ctx.lineTo(shape.x + shape.width, shape.y + shape.height)
        ctx.lineTo(shape.x, shape.y + shape.height)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
        break
        
      case 'text':
        ctx.font = `${shape.fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`
        ctx.fillStyle = shape.fillColor
        ctx.fillText(shape.text, shape.x, shape.y + shape.fontSize)
        break
        
      default:
        break
    }
  }

  // 获取形状边界
  const getShapeBounds = (shape) => {
    if (shape.type === 'text') {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      ctx.font = `${shape.fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`
      const metrics = ctx.measureText(shape.text)
      return {
        x: shape.x,
        y: shape.y,
        width: metrics.width,
        height: shape.fontSize
      }
    }
    
    return {
      x: Math.min(shape.x, shape.x + shape.width),
      y: Math.min(shape.y, shape.y + shape.height),
      width: Math.abs(shape.width),
      height: Math.abs(shape.height)
    }
  }

  // 检查点是否在形状内
  const isPointInShape = (x, y, shape) => {
    const bounds = getShapeBounds(shape)
    return (
      x >= bounds.x &&
      x <= bounds.x + bounds.width &&
      y >= bounds.y &&
      y <= bounds.y + bounds.height
    )
  }

  // 鼠标事件处理
  const getMousePos = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }

  const handleMouseDown = (e) => {
    const pos = getMousePos(e)
    
    if (currentTool === 'select') {
      // 查找点击的形状
      for (let i = shapes.length - 1; i >= 0; i--) {
        if (isPointInShape(pos.x, pos.y, shapes[i])) {
          setSelectedShape(shapes[i].id)
          setDragOffset({
            x: pos.x - shapes[i].x,
            y: pos.y - shapes[i].y
          })
          setIsDragging(true)
          return
        }
      }
      setSelectedShape(null)
    } else if (currentTool === 'text') {
      // 添加文字
      const newShape = {
        id: Date.now(),
        type: 'text',
        x: pos.x,
        y: pos.y,
        text: textContent,
        fontSize: fontSize,
        fillColor: fillColor,
        strokeColor: strokeColor,
        strokeWidth: strokeWidth
      }
      setShapes([...shapes, newShape])
      setSelectedShape(newShape.id)
      setCurrentTool('select')
    } else {
      // 开始绘制形状
      setIsDrawing(true)
      setStartPos(pos)
      setCurrentPos(pos)
      
      const newShape = {
        id: Date.now(),
        type: currentTool,
        x: pos.x,
        y: pos.y,
        width: 0,
        height: 0,
        fillColor: fillColor,
        strokeColor: strokeColor,
        strokeWidth: strokeWidth
      }
      setDrawingShape(newShape)
    }
  }

  const handleMouseMove = (e) => {
    const pos = getMousePos(e)
    
    if (isDragging && selectedShape) {
      setShapes(shapes.map(s => {
        if (s.id === selectedShape) {
          return {
            ...s,
            x: pos.x - dragOffset.x,
            y: pos.y - dragOffset.y
          }
        }
        return s
      }))
    } else if (isDrawing && drawingShape) {
      setCurrentPos(pos)
      setDrawingShape({
        ...drawingShape,
        width: pos.x - startPos.x,
        height: pos.y - startPos.y
      })
    }
  }

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false)
    }
    
    if (isDrawing && drawingShape) {
      const width = Math.abs(drawingShape.width)
      const height = Math.abs(drawingShape.height)
      
      if (width > 5 && height > 5) {
        // 修正负宽高
        const finalShape = {
          ...drawingShape,
          x: drawingShape.width < 0 ? startPos.x + drawingShape.width : startPos.x,
          y: drawingShape.height < 0 ? startPos.y + drawingShape.height : startPos.y,
          width: width,
          height: height
        }
        setShapes([...shapes, finalShape])
        setSelectedShape(finalShape.id)
      }
      
      setIsDrawing(false)
      setDrawingShape(null)
      setCurrentTool('select')
    }
  }

  // 删除选中形状
  const deleteSelectedShape = () => {
    if (selectedShape) {
      setShapes(shapes.filter(s => s.id !== selectedShape))
      setSelectedShape(null)
    }
  }

  // 清空画布
  const clearCanvas = () => {
    setShapes([])
    setSelectedShape(null)
  }

  // 导出图片
  const exportImage = () => {
    const canvas = canvasRef.current
    const link = document.createElement('a')
    link.download = 'graphic.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  // 获取选中的形状数据
  const selectedShapeData = shapes.find(s => s.id === selectedShape)

  return (
    <div className="app">
      <header className="header">
        <h1>🎨 在线图形制作工具</h1>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={clearCanvas}>
            清空画布
          </button>
          <button className="btn btn-primary" onClick={exportImage}>
            导出图片
          </button>
        </div>
      </header>
      
      <div className="main-content">
        <div className="toolbar">
          <div className="tool-section">
            <h3>绘图工具</h3>
            <div className="tool-buttons">
              <button 
                className={`tool-btn ${currentTool === 'select' ? 'active' : ''}`}
                onClick={() => setCurrentTool('select')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
                </svg>
                <span>选择</span>
              </button>
              <button 
                className={`tool-btn ${currentTool === 'rectangle' ? 'active' : ''}`}
                onClick={() => setCurrentTool('rectangle')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                </svg>
                <span>矩形</span>
              </button>
              <button 
                className={`tool-btn ${currentTool === 'circle' ? 'active' : ''}`}
                onClick={() => setCurrentTool('circle')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="9"/>
                </svg>
                <span>圆形</span>
              </button>
              <button 
                className={`tool-btn ${currentTool === 'triangle' ? 'active' : ''}`}
                onClick={() => setCurrentTool('triangle')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 3L22 21H2L12 3z"/>
                </svg>
                <span>三角形</span>
              </button>
              <button 
                className={`tool-btn ${currentTool === 'text' ? 'active' : ''}`}
                onClick={() => setCurrentTool('text')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 7V4h16v3M9 20h6M12 4v16"/>
                </svg>
                <span>文字</span>
              </button>
            </div>
          </div>
          
          <div className="tool-section">
            <h3>颜色与样式</h3>
            <div className="color-picker-group">
              <div className="color-picker-item">
                <label>填充色</label>
                <input 
                  type="color" 
                  value={fillColor} 
                  onChange={(e) => setFillColor(e.target.value)}
                />
              </div>
              <div className="color-picker-item">
                <label>边框色</label>
                <input 
                  type="color" 
                  value={strokeColor} 
                  onChange={(e) => setStrokeColor(e.target.value)}
                />
              </div>
              <div className="color-picker-item">
                <label>边框粗细</label>
                <input 
                  type="range" 
                  min="0" 
                  max="10" 
                  value={strokeWidth}
                  onChange={(e) => setStrokeWidth(Number(e.target.value))}
                />
                <span>{strokeWidth}px</span>
              </div>
            </div>
          </div>
          
          <div className="tool-section">
            <h3>文字设置</h3>
            <div className="text-input-group">
              <input 
                type="text" 
                placeholder="输入文字内容"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
              />
              <div className="color-picker-item">
                <label>字号</label>
                <input 
                  type="number" 
                  min="12" 
                  max="120" 
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
          
          <div className="tool-section">
            <h3>图形列表</h3>
            {shapes.length === 0 ? (
              <p style={{ color: '#999', fontSize: '14px' }}>暂无图形</p>
            ) : (
              <div className="shape-list">
                {shapes.map(shape => (
                  <div 
                    key={shape.id}
                    className={`shape-item ${selectedShape === shape.id ? 'selected' : ''}`}
                    onClick={() => setSelectedShape(shape.id)}
                  >
                    <div className="shape-item-info">
                      <div 
                        className="shape-color-preview" 
                        style={{ backgroundColor: shape.fillColor }}
                      />
                      <span>
                        {shape.type === 'text' ? shape.text : 
                         shape.type === 'rectangle' ? '矩形' :
                         shape.type === 'circle' ? '圆形' : '三角形'}
                      </span>
                    </div>
                    <button 
                      className="shape-delete"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShapes(shapes.filter(s => s.id !== shape.id))
                        if (selectedShape === shape.id) setSelectedShape(null)
                      }}
                    >
                      删除
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="canvas-container">
          <div className="canvas-wrapper">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{ cursor: currentTool === 'select' ? 'default' : 'crosshair' }}
            />
          </div>
        </div>
        
        <div className="properties-panel">
          <h3>属性面板</h3>
          {selectedShapeData ? (
            <>
              <div className="property-item">
                <label>类型</label>
                <input 
                  type="text" 
                  value={
                    selectedShapeData.type === 'rectangle' ? '矩形' :
                    selectedShapeData.type === 'circle' ? '圆形' :
                    selectedShapeData.type === 'triangle' ? '三角形' : '文字'
                  } 
                  disabled 
                />
              </div>
              
              {selectedShapeData.type !== 'text' && (
                <>
                  <div className="property-item">
                    <label>X 坐标</label>
                    <input 
                      type="number" 
                      value={Math.round(selectedShapeData.x)}
                      onChange={(e) => {
                        setShapes(shapes.map(s => 
                          s.id === selectedShape ? { ...s, x: Number(e.target.value) } : s
                        ))
                      }}
                    />
                  </div>
                  <div className="property-item">
                    <label>Y 坐标</label>
                    <input 
                      type="number" 
                      value={Math.round(selectedShapeData.y)}
                      onChange={(e) => {
                        setShapes(shapes.map(s => 
                          s.id === selectedShape ? { ...s, y: Number(e.target.value) } : s
                        ))
                      }}
                    />
                  </div>
                  <div className="property-item">
                    <label>宽度</label>
                    <input 
                      type="number" 
                      value={Math.round(selectedShapeData.width)}
                      onChange={(e) => {
                        setShapes(shapes.map(s => 
                          s.id === selectedShape ? { ...s, width: Number(e.target.value) } : s
                        ))
                      }}
                    />
                  </div>
                  <div className="property-item">
                    <label>高度</label>
                    <input 
                      type="number" 
                      value={Math.round(selectedShapeData.height)}
                      onChange={(e) => {
                        setShapes(shapes.map(s => 
                          s.id === selectedShape ? { ...s, height: Number(e.target.value) } : s
                        ))
                      }}
                    />
                  </div>
                </>
              )}
              
              {selectedShapeData.type === 'text' && (
                <div className="property-item">
                  <label>文字内容</label>
                  <input 
                    type="text" 
                    value={selectedShapeData.text}
                    onChange={(e) => {
                      setShapes(shapes.map(s => 
                        s.id === selectedShape ? { ...s, text: e.target.value } : s
                      ))
                    }}
                  />
                </div>
              )}
              
              <div className="property-item">
                <label>填充色</label>
                <input 
                  type="color" 
                  value={selectedShapeData.fillColor}
                  onChange={(e) => {
                    setShapes(shapes.map(s => 
                      s.id === selectedShape ? { ...s, fillColor: e.target.value } : s
                    ))
                  }}
                />
              </div>
              
              <div className="property-item">
                <label>边框色</label>
                <input 
                  type="color" 
                  value={selectedShapeData.strokeColor}
                  onChange={(e) => {
                    setShapes(shapes.map(s => 
                      s.id === selectedShape ? { ...s, strokeColor: e.target.value } : s
                    ))
                  }}
                />
              </div>
              
              <div className="property-item">
                <label>边框粗细</label>
                <input 
                  type="range" 
                  min="0" 
                  max="10" 
                  value={selectedShapeData.strokeWidth}
                  onChange={(e) => {
                    setShapes(shapes.map(s => 
                      s.id === selectedShape ? { ...s, strokeWidth: Number(e.target.value) } : s
                    ))
                  }}
                />
                <span>{selectedShapeData.strokeWidth}px</span>
              </div>
              
              <button 
                className="clear-btn" 
                style={{ marginTop: '20px' }}
                onClick={deleteSelectedShape}
              >
                删除选中图形
              </button>
            </>
          ) : (
            <div className="no-selection">
              <p>请选择一个图形进行编辑</p>
              <p style={{ fontSize: '12px', marginTop: '10px', color: '#bbb' }}>
                点击画布上的图形或从左侧列表选择
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App