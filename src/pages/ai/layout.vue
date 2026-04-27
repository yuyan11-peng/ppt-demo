<template>
  <div class="sub-page">
    <div class="page-header">
      <el-button :icon="ArrowLeft" text @click="router.push('/ai')" />
      <span class="page-title">排版优化</span>
    </div>

    <!-- Tab 切换 -->
    <div class="tab-bar">
      <div
        class="tab-item"
        :class="{ active: activeTab === 'font' }"
        @click="activeTab = 'font'"
      >字体统一</div>
      <div
        class="tab-item"
        :class="{ active: activeTab === 'layout' }"
        @click="activeTab = 'layout'"
      >排版推荐</div>
    </div>

    <div class="page-body">
      <!-- 字体统一 -->
      <template v-if="activeTab === 'font'">
      <!-- 文本框列表 -->
      <div class="section">
        <div class="section-header">
          <span class="section-label">文本框</span>
          <div class="section-actions">
            <el-button size="small" @click="readFontSettingsFromPowerPoint" :loading="loading">
              <el-icon :size="14"><Refresh /></el-icon>
              从PPT读取
            </el-button>
            <el-button size="small" type="primary" class="add-btn" @click="handleAddTextBox">+ 添加</el-button>
          </div>
        </div>

        <div
          v-for="(box, index) in textBoxList"
          :key="box.id"
          class="text-box-card"
          :class="{ active: selectedTextBoxIndex === index }"
          @click="handleTextBoxClick(index)"
        >
          <div class="text-box-head">
            <span class="text-box-name">{{ box.name }}</span>
            <el-button
              text
              size="small"
              class="delete-icon-btn"
              @click.stop="handleRemoveTextBox(index)"
            >
              <el-icon :size="14"><Delete /></el-icon>
            </el-button>
          </div>
          <el-input
            v-model="box.content"
            type="textarea"
            :rows="3"
            resize="none"
            placeholder="请输入文本内容..."
            class="text-box-textarea"
            @focus="handleTextBoxFocus(index)"
          />
        </div>
      </div>

      <!-- 字体 -->
      <div class="section">
        <span class="section-label">字体</span>
        <el-select v-model="fontFamily" style="width: 100%">
          <el-option label="微软雅黑" value="Microsoft YaHei" />
          <el-option label="腾讯体 W3" value="TencentSans-W3" />
          <el-option label="宋体" value="SimSun" />
          <el-option label="黑体" value="SimHei" />
          <el-option label="Arial" value="Arial" />
        </el-select>
      </div>

      <!-- 大小 -->
      <div class="section">
        <span class="section-label">大小</span>
        <div class="size-row">
          <el-slider v-model="fontSize" :min="8" :max="72" :show-tooltip="false" class="size-slider" />
          <el-input-number v-model="fontSize" :min="8" :max="72" :controls="false" size="small" class="size-input" />
          <button
            class="bold-btn"
            :class="{ active: isBold }"
            @click="isBold = !isBold"
          >B</button>
        </div>
      </div>

      <!-- 对齐 -->
      <div class="section">
        <span class="section-label">对齐</span>
        <div class="align-row">
          <button
            class="align-btn"
            :class="{ active: align === 'left' }"
            @click="align = 'left'"
          >L</button>
          <button
            class="align-btn"
            :class="{ active: align === 'center' }"
            @click="align = 'center'"
          >C</button>
          <button
            class="align-btn"
            :class="{ active: align === 'right' }"
            @click="align = 'right'"
          >R</button>
        </div>
      </div>

      <!-- 应用按钮 -->
      <div class="section">
        <el-button type="primary" size="large" @click="applyFontSettingsToPowerPoint" :loading="loading">
          <el-icon :size="16"><Download /></el-icon>
          应用到PPT
        </el-button>
      </div>
      </template>

      <!-- 排版推荐 -->
      <template v-else>
      <!-- 当前 PPT 信息 -->
      <div v-if="store.slides.length > 0" class="ppt-info">
        <span class="ppt-info-text">当前 PPT：<strong>{{ store.slides.length }}</strong> 页幻灯片</span>
      </div>
      <div v-else class="ppt-info">
        <span class="ppt-info-text ppt-info-empty">未检测到 PPT 内容，展示全部排版模板</span>
      </div>

      <!-- 应用模板按钮 -->
      <div v-if="selectedLayout !== null" class="section">
        <el-button type="primary" size="large" @click="applyLayoutTemplateToPowerPoint(selectedLayout)" :loading="loading">
          <el-icon :size="16"><Download /></el-icon>
          应用选中模板到PPT
        </el-button>
      </div>

      <div class="layout-list">
        <div
          v-for="(item, index) in layoutRecommendations"
          :key="index"
          class="layout-card"
          :class="{ selected: selectedLayout === index }"
          @click="selectedLayout = index"
        >
          <div class="layout-card-head">
            <span class="layout-name">{{ item.name }}</span>
            <span v-if="index === 0 && store.slides.length > 0" class="recommend-tag">推荐</span>
          </div>
          <div class="layout-slide" :style="{ background: item.bgColor }">
            <div v-html="item.decorator" class="decorator-layer"></div>
            <!-- 内容 -->
            <div class="slide-content" :class="`layout-${item.layoutType}`">
              <div class="slide-title" :style="{ color: item.titleColor }">
                {{ store.slides.length > 0 ? (store.slides[0].title || '无标题') : '这是我的标题' }}
              </div>
              <div class="slide-subtitle" :style="{ color: item.subtitleColor }">
                {{ store.slides.length > 1 ? (store.slides[1].title || '') : '这是我的副标题' }}
              </div>
            </div>
          </div>
        </div>
      </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted ,onUnmounted, watch} from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Delete, Refresh, Download } from '@element-plus/icons-vue'
import { useStore } from '../../store'
import { ElMessage } from 'element-plus'
import { isOfficeContext, getOfficeContext } from '../../modules/powerpoint-api'

const router = useRouter()
const store = useStore()

const activeTab = ref<'font' | 'layout'>('font')
const fontFamily = ref('TencentSans-W3')
const fontSize = ref(12)
const isBold = ref(false)
const align = ref<'left' | 'center' | 'right'>('left')
const loading = ref(false)
const prompt = ref('')
const selectedTextBoxIndex = ref(0) // 当前选中的文本框索引
const hasPowerPointSelection = ref(false) // 是否有PowerPoint选中文本
let lastPowerPointText = '' // 最后一次从PowerPoint复制的文本

interface TextBoxItem {
  id: number
  name: string
  content: string
}

let boxIdCounter = 0

const textBoxList = ref<TextBoxItem[]>([
  { id: ++boxIdCounter, name: '文本框1', content: '' }
])

function handleAddTextBox() {
  const newIndex = textBoxList.value.length
  textBoxList.value.push({
    id: ++boxIdCounter,
    name: `文本框${newIndex + 1}`,
    content: '',
  })
  // 选中新添加的文本框
  selectedTextBoxIndex.value = newIndex
}

function handleRemoveTextBox(index: number) {
  if (textBoxList.value.length === 0) return
  textBoxList.value.splice(index, 1)
  // 如果删除的是当前选中的文本框，更新选中索引
  if (selectedTextBoxIndex.value >= index && selectedTextBoxIndex.value > 0) {
    selectedTextBoxIndex.value--
  }
}

// 处理文本框点击事件
function handleTextBoxClick(index: number) {
  selectedTextBoxIndex.value = index
}

// 从PowerPoint读取当前字体设置
async function readFontSettingsFromPowerPoint() {
  if (!isOfficeContext()) {
    ElMessage.warning('当前不在 Office 环境中，无法读取字体设置')
    return
  }
  
  loading.value = true
  try {
    const Office = getOfficeContext()
    console.log('开始从PowerPoint读取字体设置')
    
    // 检查Office.js版本
    console.log('Office.js版本:', Office.context.diagnostics.version)
    
    // 尝试使用PowerPoint.run方法读取字体设置
    console.log('尝试使用PowerPoint.run方法读取字体设置')
    
    const PowerPoint = Office.PowerPoint || (globalThis as any).PowerPoint;
    if (PowerPoint) {
      try {
        await PowerPoint.run(async (context: any) => {
          // 获取当前演示文稿
          const presentation = context.presentation;
          // 获取所有幻灯片
          const slides = presentation.slides;
          slides.load('items');
          
          await context.sync();
          console.log('获取到的幻灯片数量:', slides.items.length);
          
          // 遍历所有幻灯片
          for (let i = 0; i < slides.items.length; i++) {
            const slide = slides.items[i];
            // 获取幻灯片上的所有形状
            const shapes = slide.shapes;
            shapes.load('items');
            
            await context.sync();
            console.log('幻灯片', i, '上的形状数量:', shapes.items.length);
            
            // 遍历所有形状
            for (let j = 0; j < shapes.items.length; j++) {
              const shape = shapes.items[j];
              try {
                // 尝试获取文本框
                const textFrame = shape.textFrame;
                textFrame.load('textRange');
                
                await context.sync();
                
                // 获取文本范围
                const textRange = textFrame.textRange;
                textRange.load('text');
                
                await context.sync();
                
                // 获取当前选中的文本框的内容
                const selectedTextBox = textBoxList.value[selectedTextBoxIndex.value];
                const inputText = selectedTextBox ? selectedTextBox.content.trim() : '';
                
                // 检查文本内容是否与输入框内容相同
                console.log('形状文本内容:', textRange.text);
                console.log('输入框内容:', inputText);
                
                if (textRange.text.trim() === inputText) {
                  console.log('找到匹配的文本');
                  
                  // 获取字体
                  const font = textRange.font;
                  font.load('name', 'size', 'bold');
                  
                  // 获取段落格式
                  const paragraphFormat = textRange.paragraphFormat;
                  paragraphFormat.load('horizontalAlignment');
                  
                  await context.sync();
                  
                  // 更新字体设置
                  fontFamily.value = font.name || 'TencentSans-W3';
                  fontSize.value = font.size || 12;
                  isBold.value = font.bold || false;
                  
                  // 更新对齐方式
                  switch (paragraphFormat.horizontalAlignment) {
                    case PowerPoint.Alignment.left:
                      align.value = 'left';
                      break;
                    case PowerPoint.Alignment.center:
                      align.value = 'center';
                      break;
                    case PowerPoint.Alignment.right:
                      align.value = 'right';
                      break;
                    default:
                      align.value = 'left';
                  }
                  
                  console.log('读取到的字体设置:', {
                    fontFamily: fontFamily.value,
                    fontSize: fontSize.value,
                    isBold: isBold.value,
                    align: align.value
                  });
                  
                  ElMessage.success('字体设置已从PowerPoint读取');
                  return;
                }
              } catch (error) {
                console.warn('处理形状失败:', error);
                // 继续处理下一个形状
              }
            }
          }
          
          // 如果没有找到匹配的文本，尝试使用Common API
          console.log('没有找到匹配的文本，尝试使用Common API');
          
          // 先获取当前选中的文本
          await new Promise<void>((resolve, reject) => {
            Office.context.document.getSelectedDataAsync(
              Office.CoercionType.Text,
              (asyncResult) => {
                if (asyncResult.status === Office.AsyncResultStatus.Succeeded) {
                  const selectedText = asyncResult.value || '';
                  console.log('当前选中的文本:', selectedText);
                  
                  // 获取当前选中的文本框的内容
                  const selectedTextBox = textBoxList.value[selectedTextBoxIndex.value];
                  const inputText = selectedTextBox ? selectedTextBox.content.trim() : '';
                  console.log('输入框内容:', inputText);
                  
                  // 检查选中的文本是否与输入框内容相同
                  if (selectedText.trim() === inputText) {
                    // 由于Common API的限制，无法直接获取字体属性
                    // 这里可以提示用户
                    ElMessage.info('Common API无法直接获取字体属性，请使用PowerPoint API');
                    resolve();
                  } else {
                    console.error('选中的文本与输入框内容不匹配');
                    ElMessage.warning('选中的文本与输入框内容不匹配');
                    resolve();
                  }
                } else {
                  console.error('获取文本失败:', asyncResult.error);
                  ElMessage.warning('请先在PowerPoint中选中要读取字体设置的文本');
                  resolve();
                }
              }
            );
          });
        });
      } catch (error) {
        console.error('PowerPoint.run失败:', error);
        ElMessage.error('读取字体设置失败: ' + (error as Error).message);
      }
    } else {
      console.log('PowerPoint API不可用，使用Common API');
      
      // 如果PowerPoint API不可用，使用Common API
      // 先获取当前选中的文本
      await new Promise<void>((resolve, reject) => {
        Office.context.document.getSelectedDataAsync(
          Office.CoercionType.Text,
          (asyncResult) => {
            if (asyncResult.status === Office.AsyncResultStatus.Succeeded) {
              const selectedText = asyncResult.value || '';
              console.log('当前选中的文本:', selectedText);
              
              // 获取当前选中的文本框的内容
              const selectedTextBox = textBoxList.value[selectedTextBoxIndex.value];
              const inputText = selectedTextBox ? selectedTextBox.content.trim() : '';
              console.log('输入框内容:', inputText);
              
              // 检查选中的文本是否与输入框内容相同
              if (selectedText.trim() === inputText) {
                // 由于Common API的限制，无法直接获取字体属性
                // 这里可以提示用户
                ElMessage.info('Common API无法直接获取字体属性，请使用PowerPoint API');
                resolve();
              } else {
                console.error('选中的文本与输入框内容不匹配');
                ElMessage.warning('选中的文本与输入框内容不匹配');
                resolve();
              }
            } else {
              console.error('获取文本失败:', asyncResult.error);
              ElMessage.warning('请先在PowerPoint中选中要读取字体设置的文本');
              resolve();
            }
          }
        );
      });
    }
  } catch (error) {
    console.error('读取字体设置失败:', error);
    ElMessage.error('读取字体设置失败: ' + (error as Error).message);
  } finally {
    loading.value = false
  }
}

// 将字体设置应用到PowerPoint
async function applyFontSettingsToPowerPoint() {
  if (!isOfficeContext()) {
    ElMessage.warning('当前不在 Office 环境中，无法应用字体设置');
    return;
  }

  loading.value = true;
  try {
    const Office = getOfficeContext();
    console.log('开始将字体设置应用到PowerPoint');
    console.log('字体设置: ', { fontFamily: fontFamily.value, fontSize: fontSize.value, isBold: isBold.value, align: align.value });

    // 1. 获取选中的纯文本
    const selectedText = await new Promise<string>((resolve, reject) => {
      Office.context.document.getSelectedDataAsync(Office.CoercionType.Text, (res) => {
        if (res.status === Office.AsyncResultStatus.Succeeded) {
          resolve(res.value || '');
        } else {
          reject(new Error('获取选中文本失败: ' + res.error.message));
        }
      });
    });

    if (!selectedText.trim()) {
      ElMessage.warning('请先在 PowerPoint 中选中一段文本');
      loading.value = false;
      return;
    }

    // 2. 尝试使用PowerPoint.run方法设置字体属性
    console.log('尝试使用PowerPoint.run方法设置字体属性');
    
    const PowerPoint = Office.PowerPoint || (globalThis as any).PowerPoint;
    if (PowerPoint) {
      try {
        await PowerPoint.run(async (context: any) => {
          // 获取当前演示文稿
          const presentation = context.presentation;
          // 获取所有幻灯片
          const slides = presentation.slides;
          slides.load('items');
          
          await context.sync();
          console.log(11);
          
          // 遍历所有幻灯片
          for (let i = 0; i < slides.items.length; i++) {
            const slide = slides.items[i];
            // 获取幻灯片上的所有形状
            const shapes = slide.shapes;
            shapes.load('items');
            
            await context.sync();
            
            // 遍历所有形状
            for (let j = 0; j < shapes.items.length; j++) {
              const shape = shapes.items[j];
              try {
                console.log(44);
                
                console.log(33);
                
                // 尝试获取文本框
                const textFrame = shape.textFrame;
                textFrame.load('textRange');
                
                await context.sync();
                
                // 获取文本范围
                const textRange = textFrame.textRange;
                // 获取字体
                const font = textRange.font;
                // 设置字体属性
                font.name = fontFamily.value;
                font.size = fontSize.value;
                font.bold = isBold.value;
                
                // 设置对齐方式
                textRange.paragraphFormat.horizontalAlignment = align.value;
                console.log(22);
                
                await context.sync();
                console.log('字体设置应用成功');
              } catch (error) {
                console.warn('处理形状失败:', error);
                // 继续处理下一个形状
              }
            }
          }
          
          ElMessage.success('字体设置已应用');
        });
      } catch (error) {
        console.error('PowerPoint.run失败:', error);
        // 如果PowerPoint.run失败，尝试使用setSelectedDataAsync方法
        console.log('PowerPoint.run失败，尝试使用setSelectedDataAsync方法');
        
        // 尝试设置选中的文本的字体属性，保持文本内容不变
        await new Promise<void>((resolve, reject) => {
          Office.context.document.setSelectedDataAsync(
            selectedText, // 使用当前选中的文本，保持内容不变
            {
              coercionType: Office.CoercionType.Text,
              font: {
                name: fontFamily.value,
                size: fontSize.value,
                bold: isBold.value
              }
            },
            (setResult) => {
              if (setResult.status === Office.AsyncResultStatus.Succeeded) {
                console.log('字体设置应用成功')
                ElMessage.success('字体设置已应用')
                resolve()
              } else {
                console.error('设置失败:', setResult.error)
                ElMessage.error('设置失败: ' + setResult.error.message)
                reject(new Error('设置失败: ' + setResult.error.message))
              }
            }
          );
        });
      }
    } else {
      console.log('PowerPoint API不可用，使用setSelectedDataAsync方法');
      
      // 如果PowerPoint API不可用，使用setSelectedDataAsync方法
      // 尝试设置选中的文本的字体属性，保持文本内容不变
      await new Promise<void>((resolve, reject) => {
        Office.context.document.setSelectedDataAsync(
          selectedText, // 使用当前选中的文本，保持内容不变
          {
            coercionType: Office.CoercionType.Text,
            font: {
              name: fontFamily.value,
              size: fontSize.value,
              bold: isBold.value
            }
          },
          (setResult) => {
            if (setResult.status === Office.AsyncResultStatus.Succeeded) {
              console.log('字体设置应用成功')
              ElMessage.success('字体设置已应用')
              resolve()
            } else {
              console.error('设置失败:', setResult.error)
              ElMessage.error('设置失败: ' + setResult.error.message)
              reject(new Error('设置失败: ' + setResult.error.message))
            }
          }
        );
      });
    }
  } catch (error) {
    console.error('应用字体设置失败:', error);
    ElMessage.error('应用字体设置失败: ' + (error as Error).message);
  } finally {
    loading.value = false;
  }
}

// 辅助函数：防止 HTML 注入
function escapeHtml(str: string) {
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}
// 应用排版模板到PowerPoint
async function applyLayoutTemplateToPowerPoint(index: number) {
  if (!isOfficeContext()) {
    ElMessage.warning('当前不在 Office 环境中，无法应用排版模板')
    return
  }
  
  loading.value = true
  try {
    const Office = getOfficeContext()
    const template = layoutRecommendations.value[index]
    console.log('开始将排版模板应用到PowerPoint:', template)
    
    // 这里需要根据PowerPoint API的实际情况实现应用排版模板的逻辑
    ElMessage.info('将排版模板应用到PowerPoint功能开发中')
  } catch (error) {
    console.error('应用排版模板失败:', error)
    ElMessage.error('应用排版模板失败: ' + (error as Error).message)
  } finally {
    loading.value = false
  }
}

// ===== 排版推荐 =====
interface LayoutRecommendation {
  name: string
  bgColor: string
  titleColor: string
  subtitleColor: string
  layoutType: string
  decorator: string
}

const selectedLayout = ref<number | null>(null)

// 所有可用的排版模板
const allLayoutTemplates: LayoutRecommendation[] = [
  // 1. 白底 + 蓝色三角装饰（左对齐标题）
  {
    name: '简约白底',
    bgColor: '#ffffff',
    titleColor: '#222',
    subtitleColor: '#999',
    layoutType: 'left',
    decorator: `
      <svg width="100%" height="100%" viewBox="0 0 160 90" preserveAspectRatio="none" style="position:absolute;bottom:0;right:0;">
        <polygon points="160,40 160,90 100,90" fill="#1890ff"/>
      </svg>
      <div style="position:absolute;top:8px;left:12px;right:12px;bottom:8px;border:1px solid #e5e6eb;"></div>
    `,
  },
  // 2. 深色 + 圆环装饰（居中）
  {
    name: '深色圆环',
    bgColor: '#1a1a2e',
    titleColor: '#fff',
    subtitleColor: '#888',
    layoutType: 'center',
    decorator: `
      <svg width="100%" height="100%" viewBox="0 0 160 90" preserveAspectRatio="xMidYMid meet" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:70px;height:70px;opacity:0.7;">
        <circle cx="35" cy="35" r="32" fill="none" stroke="#fff" stroke-width="1"/>
        <circle cx="35" cy="35" r="26" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="0.5"/>
        <circle cx="35" cy="35" r="20" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="0.5"/>
      </svg>
      <svg viewBox="0 0 60 16" style="position:absolute;top:14px;left:10px;width:30px;height:8px;opacity:0.3;">
        <path d="M0,8 Q7,2 15,8 T30,8 T45,8 T60,8" fill="none" stroke="#fff" stroke-width="1"/>
      </svg>
      <div style="position:absolute;top:22px;left:18px;width:5px;height:5px;border-radius:50%;background:#f59e42;opacity:0.8;"></div>
      <div style="position:absolute;bottom:24px;right:28px;width:4px;height:4px;border-radius:50%;background:#fff;opacity:0.5;"></div>
      <svg viewBox="0 0 16 16" style="position:absolute;bottom:12px;right:14px;width:16px;height:16px;opacity:0.2;">
        <circle cx="3" cy="3" r="1" fill="#fff"/><circle cx="9" cy="3" r="1" fill="#fff"/><circle cx="15" cy="3" r="1" fill="#fff"/>
        <circle cx="3" cy="9" r="1" fill="#fff"/><circle cx="9" cy="9" r="1" fill="#fff"/><circle cx="15" cy="9" r="1" fill="#fff"/>
      </svg>
    `,
  },
  // 3. 黑色 + 白色波浪分割（左对齐）
  {
    name: '暗夜波浪',
    bgColor: '#111',
    titleColor: '#eee',
    subtitleColor: '#999',
    layoutType: 'left',
    decorator: `
      <svg width="100%" height="100%" viewBox="0 0 160 90" preserveAspectRatio="none" style="position:absolute;bottom:0;left:0;">
        <path d="M0,65 Q20,55 40,62 T80,58 T120,64 T160,56 L160,90 L0,90 Z" fill="#e0e0e0"/>
        <path d="M0,72 Q25,66 50,70 T100,67 T150,73 L160,68 L160,90 L0,90 Z" fill="#bbb"/>
      </svg>
    `,
  },
  // 4. 浅灰白 + 圆形边框（居中）
  {
    name: '素雅椭圆',
    bgColor: '#fafafa',
    titleColor: '#333',
    subtitleColor: '#aaa',
    layoutType: 'center',
    decorator: `
      <svg width="100%" height="100%" viewBox="0 0 160 90" preserveAspectRatio="xMidYMid meet" style="position:absolute;left:50%;top:48%;transform:translate(-50%,-50%);width:80px;height:46px;">
        <ellipse cx="40" cy="23" rx="38" ry="21" fill="none" stroke="#ddd" stroke-width="1"/>
      </svg>
      <div style="position:absolute;bottom:26px;left:50%;transform:translateX(-50%);width:36px;height:1px;background:#e8b86d;"></div>
    `,
  },
  // 5. 深蓝渐变 + 几何装饰（居中偏下）
  {
    name: '深海几何',
    bgColor: 'linear-gradient(135deg, #0c2d48, #145374)',
    titleColor: '#fff',
    subtitleColor: 'rgba(255,255,255,0.6)',
    layoutType: 'center-bottom',
    decorator: `
      <svg width="100%" height="100%" viewBox="0 0 160 90" preserveAspectRatio="none" style="position:absolute;top:0;right:0;opacity:0.15;">
        <circle cx="140" cy="10" r="45" fill="rgba(255,255,255,0.08)"/>
        <circle cx="130" cy="80" r="35" fill="rgba(255,255,255,0.05)"/>
      </svg>
      <svg viewBox="0 0 120 60" style="position:absolute;bottom:0;left:0;width:75px;height:38px;opacity:0.06;">
        <rect x="0" y="0" width="120" height="60" fill="#fff" transform="skewY(-8) translate(0,8)"/>
      </svg>
    `,
  },
  // 6. 红色活力（左对齐）
  {
    name: '活力红',
    bgColor: '#fff',
    titleColor: '#222',
    subtitleColor: '#888',
    layoutType: 'left',
    decorator: `
      <div style="position:absolute;top:0;left:0;width:6px;height:100%;background:linear-gradient(180deg,#ff4d4f,#ff7875);"></div>
      <div style="position:absolute;bottom:16px;right:16px;width:24px;height:24px;border-radius:50%;background:rgba(255,77,79,0.12);"></div>
    `,
  },
  // 7. 绿色清新（居中）
  {
    name: '清新绿',
    bgColor: '#f6ffed',
    titleColor: '#237804',
    subtitleColor: '#73d13d',
    layoutType: 'center',
    decorator: `
      <div style="position:absolute;top:12px;right:12px;width:20px;height:20px;border-radius:50%;background:rgba(82,196,26,0.15);"></div>
      <div style="position:absolute;bottom:18px;left:16px;width:30px;height:2px;background:#b7eb8f;border-radius:1px;"></div>
      <div style="position:absolute;bottom:14px;left:16px;width:18px;height:2px;background:#d9f7be;border-radius:1px;"></div>
    `,
  },
  // 8. 渐变紫（居中偏下）
  {
    name: '梦幻紫',
    bgColor: 'linear-gradient(135deg, #722ed1, #b37feb)',
    titleColor: '#fff',
    subtitleColor: 'rgba(255,255,255,0.7)',
    layoutType: 'center-bottom',
    decorator: `
      <div style="position:absolute;top:10px;left:14px;width:10px;height:10px;border:1px solid rgba(255,255,255,0.3);border-radius:50%;"></div>
      <div style="position:absolute;bottom:14px;right:16px;width:16px;height:16px;border:1px solid rgba(255,255,255,0.2);transform:rotate(45deg);"></div>
      <div style="position:absolute;top:50%;right:14px;width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,0.15);"></div>
    `,
  },
]

// 根据当前 PPT 内容推荐排版
const layoutRecommendations = computed(() => {
  const slides = store.slides
  if (!slides || slides.length === 0) {
    // 没有 PPT 内容时展示全部模板
    return allLayoutTemplates
  }

  // 分析幻灯片特征
  const hasTitleSlide = slides.some(s => s.layout === 'title')
  const contentSlides = slides.filter(s => s.layout === 'content')
  const avgContentLength = contentSlides.length > 0
    ? contentSlides.reduce((sum, s) => sum + (s.markdown?.length || 0), 0) / contentSlides.length
    : 0

  // 根据特征评分推荐
  const scored = allLayoutTemplates.map((tpl, idx) => {
    let score = 50 // 基础分

    // 标题页 → 推荐居中/居中偏下的排版
    if (hasTitleSlide) {
      if (tpl.layoutType === 'center' || tpl.layoutType === 'center-bottom') {
        score += 20
      }
    }

    // 内容多的 PPT → 推荐简洁清爽的排版
    if (contentSlides.length > 4) {
      if (tpl.bgColor === '#ffffff' || tpl.bgColor === '#fafafa') {
        score += 15
      }
    }

    // 内容少的 PPT → 推荐深色/有设计感的排版
    if (contentSlides.length <= 3) {
      if (tpl.bgColor !== '#ffffff' && tpl.bgColor !== '#fafafa') {
        score += 15
      }
    }

    // 单个幻灯片内容长 → 推荐左对齐
    if (avgContentLength > 200) {
      if (tpl.layoutType === 'left') {
        score += 10
      }
    }

    // 单个幻灯片内容短 → 推荐居中
    if (avgContentLength <= 200) {
      if (tpl.layoutType === 'center' || tpl.layoutType === 'center-bottom') {
        score += 10
      }
    }

    return { ...tpl, score, originalIndex: idx }
  })

  // 按评分排序，取前5个
  return scored.sort((a, b) => b.score - a.score).slice(0, 5)
})

// 监听输入框获得焦点事件，当输入框获得焦点时，粘贴从PPT复制的文本
function handleTextBoxFocus(index: number) {
  // 更新当前选中的文本框索引
  selectedTextBoxIndex.value = index
  
  try {
    const Office = (globalThis as any).Office
    if (!Office?.context?.document) return
    console.log('输入框获得焦点，准备粘贴:', index);
    
    Office.context.document.getSelectedDataAsync(
      Office.CoercionType.Text,
      (asyncResult: any) => {
        if (asyncResult.status === Office.AsyncResultStatus.Succeeded && asyncResult.value) {
          console.log('从PPT获取到文本:', asyncResult.value);
          
          const selectedText = asyncResult.value.trim()
          if (selectedText && textBoxList.value.length > 0) {
            // 存储最后一次从PowerPoint复制的文本
            lastPowerPointText = selectedText
            // 将选中的文字粘贴到当前选中的文本框中
            // 如果文本框已有内容，就接上之前已有的内容
            const currentText = textBoxList.value[selectedTextBoxIndex.value].content
            textBoxList.value[selectedTextBoxIndex.value].content = currentText ? currentText + ' ' + selectedText : selectedText
            console.log('文本已粘贴到:', selectedTextBoxIndex.value);
            // 设置有PowerPoint选中文本的标志
            hasPowerPointSelection.value = true
          }
        }
      }
    )
  } catch (error) {
    console.error('获取选中文本失败:', error)
  }
}

onMounted(() => { })
onUnmounted(() => { })

// 监听字体大小变化，同步到PowerPoint
watch(fontSize, async (newSize) => {
  if (!isOfficeContext()) {
    return
  }
  
  try {
    const Office = getOfficeContext()
    console.log('开始调整PowerPoint字体大小:', newSize)
    
    // 检查PowerPoint文档是否可用
    if (!Office.context.document) {
      console.error('PowerPoint文档不可用')
      ElMessage.error('PowerPoint文档不可用')
      return
    }
    
    // 检查Office.js版本
    console.log('Office.js版本:', Office.context.diagnostics.version)
    
    // 先获取当前选中的文本，然后使用相同的文本内容来设置字体大小
    await new Promise<void>((resolve, reject) => {
      Office.context.document.getSelectedDataAsync(
        Office.CoercionType.Text,
        (asyncResult) => {
          if (asyncResult.status === Office.AsyncResultStatus.Succeeded) {
            console.log('当前选中的文本:', asyncResult.value)
            console.log('选中的文本长度:', asyncResult.value.length)
            
            // 尝试设置选中的文本的字体大小，保持文本内容不变
            Office.context.document.setSelectedDataAsync(
              asyncResult.value, // 使用当前选中的文本，保持内容不变
              {
                coercionType: Office.CoercionType.Text,
                font: {
                  size: newSize
                }
              },
              (setResult) => {
                if (setResult.status === Office.AsyncResultStatus.Succeeded) {
                  console.log('字体大小设置成功:', newSize)
                  ElMessage.success('字体大小已调整为: ' + newSize)
                  resolve()
                } else {
                  console.error('设置失败:', setResult.error)
                  ElMessage.error('设置失败: ' + setResult.error.message)
                  reject(new Error('设置失败: ' + setResult.error.message))
                }
              }
            )
          } else {
            console.error('获取文本失败:', asyncResult.error)
            ElMessage.warning('请先在PowerPoint中选中要调整字体大小的文本')
            reject(new Error('获取文本失败: ' + asyncResult.error.message))
          }
        }
      )
    })
  } catch (error) {
    console.error('调整字体大小失败:', error)
    ElMessage.error('调整字体大小失败: ' + (error as Error).message)
  }
})

// 监听字体家族变化，同步到PowerPoint
watch(fontFamily, async (newFamily) => {
  if (!isOfficeContext()) {
    return
  }
  
  try {
    const Office = getOfficeContext()
    console.log('开始调整PowerPoint字体家族:', newFamily)
    
    // 检查PowerPoint文档是否可用
    if (!Office.context.document) {
      console.error('PowerPoint文档不可用')
      ElMessage.error('PowerPoint文档不可用')
      return
    }
    
    // 检查Office.js版本
    console.log('Office.js版本:', Office.context.diagnostics.version)
    
    // 先获取当前选中的文本，然后使用相同的文本内容来设置字体家族
    await new Promise<void>((resolve, reject) => {
      Office.context.document.getSelectedDataAsync(
        Office.CoercionType.Text,
        (asyncResult) => {
          if (asyncResult.status === Office.AsyncResultStatus.Succeeded) {
            console.log('当前选中的文本:', asyncResult.value)
            console.log('选中的文本长度:', asyncResult.value.length)
            
            // 尝试设置选中的文本的字体家族，保持文本内容不变
            Office.context.document.setSelectedDataAsync(
              asyncResult.value, // 使用当前选中的文本，保持内容不变
              {
                coercionType: Office.CoercionType.Text,
                font: {
                  name: newFamily
                }
              },
              (setResult) => {
                if (setResult.status === Office.AsyncResultStatus.Succeeded) {
                  console.log('字体家族设置成功:', newFamily)
                  ElMessage.success('字体家族已调整为: ' + newFamily)
                  resolve()
                } else {
                  console.error('设置失败:', setResult.error)
                  ElMessage.error('设置失败: ' + setResult.error.message)
                  reject(new Error('设置失败: ' + setResult.error.message))
                }
              }
            )
          } else {
            console.error('获取文本失败:', asyncResult.error)
            ElMessage.warning('请先在PowerPoint中选中要调整字体家族的文本')
            reject(new Error('获取文本失败: ' + asyncResult.error.message))
          }
        }
      )
    })
  } catch (error) {
    console.error('调整字体家族失败:', error)
    ElMessage.error('调整字体家族失败: ' + (error as Error).message)
  }
})

// 监听粗体变化，同步到PowerPoint
watch(isBold, async (newBold) => {
  if (!isOfficeContext()) {
    return
  }
  
  try {
    const Office = getOfficeContext()
    console.log('开始调整PowerPoint粗体:', newBold)
    
    // 检查PowerPoint文档是否可用
    if (!Office.context.document) {
      console.error('PowerPoint文档不可用')
      ElMessage.error('PowerPoint文档不可用')
      return
    }
    
    // 检查Office.js版本
    console.log('Office.js版本:', Office.context.diagnostics.version)
    
    // 先获取当前选中的文本，然后使用相同的文本内容来设置粗体
    await new Promise<void>((resolve, reject) => {
      Office.context.document.getSelectedDataAsync(
        Office.CoercionType.Text,
        (asyncResult) => {
          if (asyncResult.status === Office.AsyncResultStatus.Succeeded) {
            console.log('当前选中的文本:', asyncResult.value)
            console.log('选中的文本长度:', asyncResult.value.length)
            
            // 尝试设置选中的文本的粗体，保持文本内容不变
            Office.context.document.setSelectedDataAsync(
              asyncResult.value, // 使用当前选中的文本，保持内容不变
              {
                coercionType: Office.CoercionType.Text,
                font: {
                  bold: newBold
                }
              },
              (setResult) => {
                if (setResult.status === Office.AsyncResultStatus.Succeeded) {
                  console.log('粗体设置成功:', newBold)
                  ElMessage.success('粗体已' + (newBold ? '开启' : '关闭'))
                  resolve()
                } else {
                  console.error('设置失败:', setResult.error)
                  ElMessage.error('设置失败: ' + setResult.error.message)
                  reject(new Error('设置失败: ' + setResult.error.message))
                }
              }
            )
          } else {
            console.error('获取文本失败:', asyncResult.error)
            ElMessage.warning('请先在PowerPoint中选中要调整粗体的文本')
            reject(new Error('获取文本失败: ' + asyncResult.error.message))
          }
        }
      )
    })
  } catch (error) {
    console.error('调整粗体失败:', error)
    ElMessage.error('调整粗体失败: ' + (error as Error).message)
  }
})

// 监听对齐方式变化，同步到PowerPoint
watch(align, async (newAlign) => {
  if (!isOfficeContext()) {
    return
  }
  
  try {
    const Office = getOfficeContext()
    console.log('开始调整PowerPoint对齐方式:', newAlign)
    
    // 检查PowerPoint文档是否可用
    if (!Office.context.document) {
      console.error('PowerPoint文档不可用')
      ElMessage.error('PowerPoint文档不可用')
      return
    }
    
    // 尝试使用不同的方法调整对齐方式
    try {
      console.log('尝试使用setSelectedDataAsync方法')
      
      // 直接使用setSelectedDataAsync方法，不先获取文本
      await new Promise<void>((resolve, reject) => {
        Office.context.document.setSelectedDataAsync(
          '', // 空字符串，只调整格式
          {
            coercionType: Office.CoercionType.Text
          },
          (setResult) => {
            if (setResult.status === Office.AsyncResultStatus.Succeeded) {
              console.log('对齐方式调整成功:', newAlign)
              ElMessage.success('对齐方式已调整为: ' + newAlign)
              resolve()
            } else {
              console.error('设置失败:', setResult.error)
              reject(new Error('设置失败: ' + setResult.error.message))
            }
          }
        )
      })
    } catch (error) {
      console.error('调整对齐方式失败:', error)
      ElMessage.error('调整对齐方式失败: ' + (error as Error).message)
    }
  } catch (error) {
    console.error('调整对齐方式失败:', error)
  }
})
</script>

<style scoped>
.sub-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
}

.page-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

/* Tab 栏 */
.tab-bar {
  display: flex;
  gap: 24px;
  padding: 16px 20px 0;
  flex-shrink: 0;
}

.tab-item {
  font-size: 15px;
  color: #999;
  cursor: pointer;
  padding: 6px 18px;
  border-radius: 8px;
  transition: all 0.2s;
  font-weight: 500;
}

.tab-item:hover {
  color: #666;
}

.tab-item.active {
  color: #1890ff;
  background: #f0f7ff;
  border: 1px solid #b3d8ff;
}

/* 内容区域 */
.page-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px 32px;
}

/* 区块 */
.section {
  margin-bottom: 22px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-label {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
  display: block;
}

.add-btn {
  font-size: 12px;
  padding: 4px 12px !important;
}

/* 文本框卡片 */
.text-box-card {
  background: #fafafa;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.text-box-card.active {
  background: #e6f7ff;
  border: 1px solid #1890ff;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
}

.text-box-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.text-box-name {
  font-size: 13px;
  font-weight: 500;
  color: #666;
}

.delete-icon-btn {
  padding: 2px !important;
  color: #bbb !important;
}

.delete-icon-btn:hover {
  color: #f56c6c !important;
}

.text-box-textarea :deep(.el-textarea__inner) {
  font-size: 13px;
  line-height: 1.5;
  box-shadow: none;
  border-color: #e0e0e0;
  background: #fff;
}

.text-box-textarea :deep(.el-textarea__inner:focus) {
  border-color: #1890ff;
}

/* 大小行 */
.size-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.size-slider {
  flex: 1;
}

.size-slider :deep(.el-slider__runway) {
  height: 4px;
}

.size-slider :deep(.el-slider__bar) {
  height: 4px;
}

.size-slider :deep(.el-slider__button-wrapper .el-slider__button) {
  width: 14px;
  height: 14px;
  border: 2px solid #1890ff;
  background: #1890ff;
}

.size-input {
  width: 60px !important;
}

.bold-btn {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1px solid #d9d9d9;
  background: #fff;
  color: #666;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  flex-shrink: 0;
}

.bold-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.bold-btn.active {
  background: #1890ff;
  border-color: #1890ff;
  color: #fff;
}

/* 对齐行 */
.align-row {
  display: flex;
  gap: 8px;
}

.align-btn {
  width: 36px;
  height: 34px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  background: #fff;
  color: #666;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.align-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.align-btn.active {
  background: #1890ff;
  border-color: #1890ff;
  color: #fff;
}

/* ===== 排版推荐 ===== */
.ppt-info {
  margin-bottom: 14px;
  padding: 10px 14px;
  background: #f0f7ff;
  border-radius: 8px;
  border: 1px solid #d6e4ff;
}

.ppt-info-text {
  font-size: 13px;
  color: #666;
}

.ppt-info-text strong {
  color: #1890ff;
}

.ppt-info-empty {
  color: #999;
  font-style: italic;
}

.layout-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.layout-card {
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
  box-shadow: 0 1px 6px rgba(0,0,0,0.08);
}

.layout-card:hover {
  box-shadow: 0 4px 14px rgba(0,0,0,0.14);
  transform: translateY(-1px);
}

.layout-card.selected {
  border-color: #1890ff;
  box-shadow: 0 4px 16px rgba(24,144,255,0.25);
}

.layout-card-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #fff;
}

.layout-name {
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

.recommend-tag {
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 10px;
  background: #1890ff;
  color: #fff;
  font-weight: 500;
}

.layout-slide {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.decorator-layer {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  pointer-events: none;
  z-index: 1;
}

.decorator-layer :deep(svg) {
  display: block;
}

.slide-content {
  position: relative;
  z-index: 2;
  padding: 20px;
  text-align: left;
  width: 100%;
}

.slide-title {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.35;
  margin-bottom: 6px;
}

.slide-subtitle {
  font-size: 11px;
  line-height: 1.5;
}

/* 居中布局 */
.layout-center :deep(.slide-content) {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 16px;
}

.layout-center :deep(.slide-subtitle) {
  margin-top: 6px;
}

/* 居中偏下布局 */
.layout-center-bottom :deep(.slide-content) {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
  padding-bottom: 22px;
}
</style>
