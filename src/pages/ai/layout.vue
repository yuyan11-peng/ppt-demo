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
let isReadingFromPPT = false // 正在从PPT读取设置时，暂停 watch 自动同步

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

// 标准化文本：去除多余空白，统一换行符，用于宽松匹配
function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')   // 统一换行符
    .replace(/\r/g, '\n')     // 统一换行符
    .replace(/[ \t]+/g, ' ')  // 多个空格/tab 合并为一个空格
    .replace(/\n\s*\n/g, '\n') // 多个空行合并为一个
    .trim()
}

// 将 PowerPoint 返回的 horizontalAlignment 值统一转换为 'left' | 'center' | 'right'
// API 可能返回: 枚举数字、大写/小写字符串、PowerPoint.Alignment 枚举值等
function parseHorizontalAlignment(value: any): 'left' | 'center' | 'right' {
  if (value == null) return 'left'
  const str = String(value).toLowerCase()
  if (str.includes('center')) return 'center'
  if (str.includes('right')) return 'right'
  if (str.includes('left')) return 'left'
  // 数字枚举：1=Left, 2=Center, 3=Right, 4=Justify, 5=Distribute
  if (value === 2) return 'center'
  if (value === 3) return 'right'
  return 'left'
}

// 从PowerPoint读取当前选中文字的字体设置
async function readFontSettingsFromPowerPoint() {
  if (!isOfficeContext()) {
    ElMessage.warning('当前不在 Office 环境中，无法读取字体设置')
    return
  }
  
  loading.value = true
  isReadingFromPPT = true
  try {
    const Office = getOfficeContext()
    console.log('开始从PowerPoint读取选中文字的字体设置')

    // Step 1: 先通过 Common API 获取PPT中当前选中的文字
    const selectedText = await new Promise<string>((resolve, reject) => {
      Office.context.document.getSelectedDataAsync(
        Office.CoercionType.Text,
        (asyncResult: any) => {
          if (asyncResult.status === Office.AsyncResultStatus.Succeeded) {
            resolve((asyncResult.value || '').trim())
          } else {
            reject(new Error('获取选中文本失败: ' + asyncResult.error.message))
          }
        }
      )
    })

    if (!selectedText) {
      ElMessage.warning('请先在PowerPoint中选中要读取字体设置的文字')
      return
    }

    console.log('PPT中选中的文字:', JSON.stringify(selectedText))

    // Step 2: 将选中的文字回显到当前输入框
    const selectedTextBox = textBoxList.value[selectedTextBoxIndex.value]
    if (selectedTextBox) {
      selectedTextBox.content = selectedText
      console.log('已将选中文本回显到输入框')
    }

    // Step 3: 使用 PowerPoint API 读取选中文字的字体属性
    const PowerPoint = Office.PowerPoint || (globalThis as any).PowerPoint
    if (!PowerPoint) {
      ElMessage.info('PowerPoint API 不可用，无法读取字体属性')
      return
    }

    await PowerPoint.run(async (context: any) => {
      // ===== 方案1: 通过 getSelectedTextRange 直接读取（最可靠） =====
      try {
        const selectedTextRange = context.presentation.getSelectedTextRange()
        // 分步加载：先加载 textRange 本身
        context.load(selectedTextRange, 'text')
        await context.sync()

        if (selectedTextRange.text && selectedTextRange.text.trim()) {
          console.log('通过 getSelectedTextRange 获取到选中文本:', selectedTextRange.text)

          // 加载字体属性（字号、字体、加粗）
          const font = selectedTextRange.font
          context.load(font, 'name, size, bold')
          await context.sync()

          // 回显字体属性到工具栏
          fontFamily.value = font.name || 'TencentSans-W3'
          fontSize.value = font.size || 12
          isBold.value = font.bold || false

          console.log('通过 getSelectedTextRange 读取字体:', {
            fontFamily: fontFamily.value,
            fontSize: fontSize.value,
            isBold: isBold.value
          })

          // 对齐方式：通过 paragraphs 集合获取实际段落格式
          // 直接使用 textRange.paragraphFormat 可能返回不准确的默认值
          try {
            // 方法A: 从 getSelectedTextRange 的 paragraphs 集合读取
            try {
              const paragraphs = selectedTextRange.paragraphs
              context.load(paragraphs, 'items')
              await context.sync()

              if (paragraphs.items && paragraphs.items.length > 0) {
                const firstParagraph = paragraphs.items[0]
                const pFormat = firstParagraph.paragraphFormat
                context.load(pFormat, 'horizontalAlignment')
                await context.sync()

                const rawAlign = pFormat.horizontalAlignment
                console.log('从段落集合读取对齐方式原始值:', rawAlign, '类型:', typeof rawAlign)
                align.value = parseHorizontalAlignment(rawAlign)
              } else {
                align.value = 'left'
              }
            } catch (paraErr: any) {
              // 方法B: 回退到 getSelectedShapes
              console.log('段落集合不可用，尝试 getSelectedShapes:', paraErr.message || paraErr)
              try {
                const selectedShapes = context.presentation.getSelectedShapes()
                context.load(selectedShapes, 'items')
                await context.sync()

                if (selectedShapes.items && selectedShapes.items.length > 0) {
                  const shape = selectedShapes.items[0]
                  const textFrame = shape.textFrame
                  context.load(textFrame, 'textRange')
                  await context.sync()

                  const shapeTextRange = textFrame.textRange
                  // 尝试从形状的 paragraphs 集合读取
                  try {
                    const shapeParagraphs = shapeTextRange.paragraphs
                    context.load(shapeParagraphs, 'items')
                    await context.sync()

                    if (shapeParagraphs.items && shapeParagraphs.items.length > 0) {
                      const sp = shapeParagraphs.items[0]
                      const spFormat = sp.paragraphFormat
                      context.load(spFormat, 'horizontalAlignment')
                      await context.sync()

                      const rawAlign = spFormat.horizontalAlignment
                      console.log('从形状段落集合读取对齐方式原始值:', rawAlign, '类型:', typeof rawAlign)
                      align.value = parseHorizontalAlignment(rawAlign)
                    } else {
                      // 最后回退到 textRange.paragraphFormat
                      const paragraphFormat = shapeTextRange.paragraphFormat
                      context.load(paragraphFormat, 'horizontalAlignment')
                      await context.sync()
                      const rawAlign = paragraphFormat.horizontalAlignment
                      console.log('从形状textRange读取对齐方式原始值:', rawAlign, '类型:', typeof rawAlign)
                      align.value = parseHorizontalAlignment(rawAlign)
                    }
                  } catch (shapeParaErr: any) {
                    const paragraphFormat = shapeTextRange.paragraphFormat
                    context.load(paragraphFormat, 'horizontalAlignment')
                    await context.sync()
                    const rawAlign = paragraphFormat.horizontalAlignment
                    console.log('回退: 从形状textRange读取对齐方式:', rawAlign, '类型:', typeof rawAlign)
                    align.value = parseHorizontalAlignment(rawAlign)
                  }
                } else {
                  align.value = 'left'
                }
              } catch (shapeErr: any) {
                console.log('getSelectedShapes 也不可用:', shapeErr.message || shapeErr)
                align.value = 'left'
              }
            }
          } catch (alignErr: any) {
            console.log('读取对齐方式全部失败:', alignErr.message || alignErr)
            align.value = 'left'
          }

          console.log('读取到的字体设置:', {
            fontFamily: fontFamily.value,
            fontSize: fontSize.value,
            isBold: isBold.value,
            align: align.value
          })

          ElMessage.success('字体设置已从PPT读取')
          return
        }
      } catch (e: any) {
        console.log('getSelectedTextRange 不可用:', e.message || e)
      }

      // ===== 方案2: 通过 getSelectedShapes 获取选中形状，读取其字体属性 =====
      try {
        const selectedShapes = context.presentation.getSelectedShapes()
        context.load(selectedShapes, 'items')
        await context.sync()

        if (selectedShapes.items && selectedShapes.items.length > 0) {
          console.log('通过 getSelectedShapes 获取到选中形状数量:', selectedShapes.items.length)

          // 取第一个选中的形状
          const shape = selectedShapes.items[0]
          const textFrame = shape.textFrame
          context.load(textFrame, 'textRange')
          await context.sync()

          const textRange = textFrame.textRange
          context.load(textRange, 'text')
          await context.sync()

          if (textRange.text && textRange.text.trim()) {
            // 加载字体和段落属性
            const font = textRange.font
            context.load(font, 'name, size, bold')
            const paragraphFormat = textRange.paragraphFormat
            context.load(paragraphFormat, 'horizontalAlignment')
            await context.sync()

            // 回显到工具栏
            fontFamily.value = font.name || 'TencentSans-W3'
            fontSize.value = font.size || 12
            isBold.value = font.bold || false

            const rawAlign2 = paragraphFormat.horizontalAlignment
            console.log('对齐方式原始值:', rawAlign2, '类型:', typeof rawAlign2)
            align.value = parseHorizontalAlignment(rawAlign2)

            console.log('读取到的字体设置:', {
              fontFamily: fontFamily.value,
              fontSize: fontSize.value,
              isBold: isBold.value,
              align: align.value
            })

            ElMessage.success('字体设置已从PPT读取')
            return
          }
        }
      } catch (e: any) {
        console.log('getSelectedShapes 不可用:', e.message || e)
      }

      // ===== 方案3: 遍历当前幻灯片的形状，用文本匹配查找 =====
      try {
        const presentation = context.presentation
        const slides = presentation.slides
        context.load(slides, 'items')
        await context.sync()

        const normalizedSelected = normalizeText(selectedText)

        let found = false
        for (let i = 0; i < slides.items.length && !found; i++) {
          const slide = slides.items[i]
          const shapes = slide.shapes
          context.load(shapes, 'items')
          await context.sync()

          for (let j = 0; j < shapes.items.length && !found; j++) {
            const shape = shapes.items[j]
            try {
              const textFrame = shape.textFrame
              context.load(textFrame, 'textRange')
              await context.sync()

              const textRange = textFrame.textRange
              context.load(textRange, 'text')
              await context.sync()

              if (!textRange.text) continue

              const shapeText = textRange.text.trim()
              const normalizedShapeText = normalizeText(shapeText)

              // 多级匹配
              const isMatch = shapeText.includes(selectedText)
                || normalizedShapeText.includes(normalizedSelected)
                || normalizedSelected.includes(normalizedShapeText)

              console.log(`形状[${i}][${j}] 文本匹配: ${isMatch}, 形状文本: ${JSON.stringify(shapeText.substring(0, 50))}`)

              if (isMatch) {
                const font = textRange.font
                context.load(font, 'name, size, bold')
                const paragraphFormat = textRange.paragraphFormat
                context.load(paragraphFormat, 'horizontalAlignment')
                await context.sync()

                fontFamily.value = font.name || 'TencentSans-W3'
                fontSize.value = font.size || 12
                isBold.value = font.bold || false

                const rawAlign3 = paragraphFormat.horizontalAlignment
                console.log('对齐方式原始值:', rawAlign3, '类型:', typeof rawAlign3)
                align.value = parseHorizontalAlignment(rawAlign3)
                ElMessage.info(`对齐原始值: ${JSON.stringify(rawAlign3)} (类型: ${typeof rawAlign3})`)

                console.log('读取到的字体设置:', {
                  fontFamily: fontFamily.value,
                  fontSize: fontSize.value,
                  isBold: isBold.value,
                  align: align.value
                })

                ElMessage.success('字体设置已从PPT读取')
                found = true
              }
            } catch (error) {
              console.warn('处理形状失败:', error)
            }
          }
        }

        if (!found) {
          ElMessage.warning('未找到选中文字对应的形状，无法读取字体属性')
        }
      } catch (e: any) {
        console.error('遍历形状失败:', e)
        ElMessage.warning('读取字体属性失败: ' + (e.message || e))
      }
    })
  } catch (error) {
    console.error('读取字体设置失败:', error)
    ElMessage.error('读取字体设置失败: ' + (error as Error).message)
  } finally {
    loading.value = false
    isReadingFromPPT = false
  }
}

// 将字体设置应用到PowerPoint
async function applyFontSettingsToPowerPoint() {
  if (!isOfficeContext()) {
    ElMessage.warning('当前不在 Office 环境中，无法应用字体设置');
    return;
  }

  loading.value = true;
  isReadingFromPPT = true
  try {
    const Office = getOfficeContext();
    const PowerPoint = Office.PowerPoint || (globalThis as any).PowerPoint;

    if (!PowerPoint) {
      ElMessage.warning('PowerPoint API 不可用，无法应用字体设置');
      return;
    }

    console.log('开始将字体设置应用到PowerPoint选中文字');
    console.log('字体设置: ', { fontFamily: fontFamily.value, fontSize: fontSize.value, isBold: isBold.value, align: align.value });

    await PowerPoint.run(async (context: any) => {
      const selectedTextRange = context.presentation.getSelectedTextRange()
      context.load(selectedTextRange, 'text')
      await context.sync()

      if (!selectedTextRange.text || !selectedTextRange.text.trim()) {
        ElMessage.warning('请先在 PowerPoint 中选中一段文本');
        return;
      }

      // 只修改选中文本的字体属性
      const font = selectedTextRange.font
      font.name = fontFamily.value
      font.size = fontSize.value
      font.bold = isBold.value

      // 设置选中文本的对齐方式
      const paragraphFormat = selectedTextRange.paragraphFormat
      paragraphFormat.horizontalAlignment = toPowerPointAlignment(align.value)

      await context.sync()
      console.log('字体设置已应用到选中文本');
      ElMessage.success('字体设置已应用到选中文本');
    });
  } catch (error) {
    console.error('应用字体设置失败:', error);
    ElMessage.error('应用字体设置失败: ' + (error as Error).message);
  } finally {
    loading.value = false;
    isReadingFromPPT = false
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

    const PowerPoint = Office.PowerPoint || (globalThis as any).PowerPoint;
    if (PowerPoint) {
      try {
        await PowerPoint.run(async (context: any) => {
          // 获取当前演示文稿
          const presentation = context.presentation;

          // 获取选中的幻灯片集合
          const selectedSlides = presentation.getSelectedSlides();
          console.log('选中的幻灯片集合:', selectedSlides);

          // 获取集合中的第一张（当前活动）幻灯片
          const firstSelectedSlide = selectedSlides.getItemAt(0);
          console.log('第一张选中的幻灯片:', firstSelectedSlide);

          // 加载幻灯片的ID和索引
          firstSelectedSlide.load('id');
          firstSelectedSlide.load('index');

          // 执行同步，从 PowerPoint 拉取数据
          await context.sync();

          // 获取索引（从0开始）
          const slideIndex = firstSelectedSlide.index;
          const slideId = firstSelectedSlide.id;

          console.log(`当前选中的幻灯片索引是: ${slideIndex}`);
          console.log(`其对应的ID是: ${slideId}`);

          // 设置目标幻灯片和索引（转换为从1开始）
          const targetSlide = firstSelectedSlide;
          const targetSlideIndex = slideIndex + 1;

          console.log('当前选中的是第', targetSlideIndex, '张幻灯片');

          // 获取目标幻灯片上的所有形状
          const shapes = targetSlide.shapes;
          shapes.load('items');
          await context.sync();

          console.log('目标幻灯片上的形状数量:', shapes.items.length);

          // 加载所有形状的文本内容
          const shapeInfoList: any[] = [];
          for (let j = 0; j < shapes.items.length; j++) {
            const shape = shapes.items[j];
            const hasTextFrame = shape.hasTextFrame;

            if (hasTextFrame) {
              const textFrame = shape.textFrame;
              textFrame.load('textRange');
            }

            // 加载位置和大小属性
            shape.load('left', 'top', 'width', 'height');
          }

          await context.sync();

          // 收集形状信息
          for (let j = 0; j < shapes.items.length; j++) {
            const shape = shapes.items[j];
            let textLength = 0;

            if (shape.hasTextFrame && shape.textFrame && shape.textFrame.textRange) {
              try {
                const textRange = shape.textFrame.textRange;
                textRange.load('text');
              } catch (e) {
                console.log('无法加载文本范围');
              }
            }

            shapeInfoList.push({
              shape: shape,
              textLength: textLength
            });
          }

          await context.sync();

          // 更新文本长度信息
          for (let j = 0; j < shapeInfoList.length; j++) {
            const info = shapeInfoList[j];
            const shape = info.shape;

            if (shape.hasTextFrame && shape.textFrame && shape.textFrame.textRange) {
              try {
                info.textLength = shape.textFrame.textRange.text?.length || 0;
              } catch (e) {
                info.textLength = 0;
              }
            }
          }

          // 根据布局类型调整形状位置
          switch (template.layoutType) {
            case 'vertical':
              await applyVerticalLayout(context, targetSlide, shapes.items, shapeInfoList, template);
              break;
            case 'horizontal':
              await applyHorizontalLayout(context, targetSlide, shapes.items, shapeInfoList, template);
              break;
            case 'center':
              await applyCenterLayout(context, targetSlide, shapes.items, shapeInfoList, template);
              break;
            case 'circular':
              await applyCircularLayout(context, targetSlide, shapes.items, shapeInfoList, template);
              break;
          }

          await context.sync();
          ElMessage.success('排版模板已应用到第 ' + targetSlideIndex + ' 张幻灯片');
        });
      } catch (error) {
        console.error('PowerPoint.run失败:', error);
        ElMessage.error('应用排版模板失败: ' + (error as Error).message);
      }
    } else {
      console.log('PowerPoint API不可用');
      ElMessage.info('PowerPoint API不可用，请确保使用支持的Office版本');
    }
  } catch (error) {
    console.error('应用排版模板失败:', error)
    ElMessage.error('应用排版模板失败: ' + (error as Error).message)
  } finally {
    loading.value = false
  }
}

// 应用上下布局
async function applyVerticalLayout(context: any, slide: any, shapes: any[], shapeInfoList: any[], template: any) {
  // 获取幻灯片尺寸
  const slideWidth = 960; // PowerPoint幻灯片默认宽度（像素）
  const slideHeight = 540; // PowerPoint幻灯片默认高度（像素）
  
  // 计算上下区域的分割点
  const splitPoint = slideHeight * 0.45;
  
  // 按内容长度排序形状
  const sortedInfo = [...shapeInfoList].sort((a, b) => b.textLength - a.textLength);
  const sortedShapes = sortedInfo.map(info => info.shape);
  
  // 将形状分为标题和内容两组
  const titleShapes = sortedShapes.slice(0, 1); // 第一个作为标题
  const contentShapes = sortedShapes.slice(1); // 其余作为内容
  
  // 设置标题区域的形状
  titleShapes.forEach((shape, index) => {
    shape.left = slideWidth * 0.1;
    shape.top = splitPoint * 0.4;
    shape.width = slideWidth * 0.8;
    shape.height = splitPoint * 0.5;
    
    // 设置字体
    if (shape.hasTextFrame && shape.textFrame && shape.textFrame.textRange) {
      const textRange = shape.textFrame.textRange;
      const font = textRange.font;
      font.name = '微软雅黑';
      font.size = 28;
      font.bold = true;
      font.color = template.titleColor;
      textRange.paragraphFormat.horizontalAlignment = PowerPoint.Alignment.center;
    }
  });
  
  // 设置内容区域的形状
  contentShapes.forEach((shape, index) => {
    shape.left = slideWidth * 0.1;
    shape.top = splitPoint + 20 + (index * 80);
    shape.width = slideWidth * 0.8;
    shape.height = 60;
    
    // 设置字体
    if (shape.hasTextFrame && shape.textFrame && shape.textFrame.textRange) {
      const textRange = shape.textFrame.textRange;
      const font = textRange.font;
      font.name = '微软雅黑';
      font.size = 16;
      font.bold = false;
      font.color = template.subtitleColor;
      textRange.paragraphFormat.horizontalAlignment = PowerPoint.Alignment.left;
    }
  });
  
  await context.sync();
}

// 应用左右布局
async function applyHorizontalLayout(context: any, slide: any, shapes: any[], shapeInfoList: any[], template: any) {
  // 获取幻灯片尺寸
  const slideWidth = 960;
  const slideHeight = 540;
  
  // 计算左右区域的分割点
  const splitPoint = slideWidth * 0.35;
  
  // 按内容长度排序形状
  const sortedInfo = [...shapeInfoList].sort((a, b) => a.textLength - b.textLength);
  const sortedShapes = sortedInfo.map(info => info.shape);
  
  // 将形状分为标题和内容两组
  const titleShapes = sortedShapes.slice(0, 1); // 最短的作为标题
  const contentShapes = sortedShapes.slice(1); // 其余作为内容
  
  // 设置左侧标题区域的形状
  titleShapes.forEach((shape, index) => {
    shape.left = 20;
    shape.top = slideHeight * 0.3;
    shape.width = splitPoint - 40;
    shape.height = slideHeight * 0.4;
    
    // 设置字体
    if (shape.hasTextFrame && shape.textFrame && shape.textFrame.textRange) {
      const textRange = shape.textFrame.textRange;
      const font = textRange.font;
      font.name = '微软雅黑';
      font.size = 24;
      font.bold = true;
      font.color = template.titleColor;
      textRange.paragraphFormat.horizontalAlignment = PowerPoint.Alignment.center;
    }
  });
  
  // 设置右侧内容区域的形状
  contentShapes.forEach((shape, index) => {
    shape.left = splitPoint + 20;
    shape.top = 40 + (index * 70);
    shape.width = slideWidth - splitPoint - 60;
    shape.height = 55;
    
    // 设置字体
    if (shape.hasTextFrame && shape.textFrame && shape.textFrame.textRange) {
      const textRange = shape.textFrame.textRange;
      const font = textRange.font;
      font.name = '微软雅黑';
      font.size = 15;
      font.bold = false;
      font.color = template.subtitleColor;
      textRange.paragraphFormat.horizontalAlignment = PowerPoint.Alignment.left;
    }
  });
  
  await context.sync();
}

// 应用居中布局
async function applyCenterLayout(context: any, slide: any, shapes: any[], shapeInfoList: any[], template: any) {
  // 获取幻灯片尺寸
  const slideWidth = 960;
  const slideHeight = 540;
  
  // 按内容长度排序形状
  const sortedInfo = [...shapeInfoList].sort((a, b) => b.textLength - a.textLength);
  const sortedShapes = sortedInfo.map(info => info.shape);
  
  // 将形状分为标题和内容两组
  const titleShapes = sortedShapes.slice(0, 1); // 最长的作为标题
  const contentShapes = sortedShapes.slice(1); // 其余作为内容
  
  // 设置标题形状（居中）
  titleShapes.forEach((shape, index) => {
    shape.left = slideWidth * 0.15;
    shape.top = slideHeight * 0.3;
    shape.width = slideWidth * 0.7;
    shape.height = slideHeight * 0.2;
    
    // 设置字体
    if (shape.hasTextFrame && shape.textFrame && shape.textFrame.textRange) {
      const textRange = shape.textFrame.textRange;
      const font = textRange.font;
      font.name = '微软雅黑';
      font.size = 32;
      font.bold = true;
      font.color = template.titleColor;
      textRange.paragraphFormat.horizontalAlignment = PowerPoint.Alignment.center;
    }
  });
  
  // 设置内容形状（标题下方居中）
  contentShapes.forEach((shape, index) => {
    shape.left = slideWidth * 0.2;
    shape.top = slideHeight * 0.55 + (index * 50);
    shape.width = slideWidth * 0.6;
    shape.height = 45;
    
    // 设置字体
    if (shape.hasTextFrame && shape.textFrame && shape.textFrame.textRange) {
      const textRange = shape.textFrame.textRange;
      const font = textRange.font;
      font.name = '微软雅黑';
      font.size = 16;
      font.bold = false;
      font.color = template.subtitleColor;
      textRange.paragraphFormat.horizontalAlignment = PowerPoint.Alignment.center;
    }
  });
  
  await context.sync();
}

// 应用环形布局
async function applyCircularLayout(context: any, slide: any, shapes: any[], shapeInfoList: any[], template: any) {
  // 获取幻灯片尺寸
  const slideWidth = 960;
  const slideHeight = 540;
  
  // 中心点坐标
  const centerX = slideWidth / 2;
  const centerY = slideHeight / 2;
  
  // 环形半径
  const radius = Math.min(slideWidth, slideHeight) * 0.25;
  
  // 按内容长度排序形状，最短的放在中心
  const sortedInfo = [...shapeInfoList].sort((a, b) => a.textLength - b.textLength);
  const sortedShapes = sortedInfo.map(info => info.shape);
  
  // 中心形状（最短的）
  const centerShape = sortedShapes[0];
  const surroundingShapes = sortedShapes.slice(1);
  
  // 设置中心形状
  if (centerShape) {
    centerShape.left = centerX - 60;
    centerShape.top = centerY - 30;
    centerShape.width = 120;
    centerShape.height = 60;
    
    // 设置字体
    if (centerShape.hasTextFrame && centerShape.textFrame && centerShape.textFrame.textRange) {
      const textRange = centerShape.textFrame.textRange;
      const font = textRange.font;
      font.name = '微软雅黑';
      font.size = 20;
      font.bold = true;
      font.color = '#1890ff';
      textRange.paragraphFormat.horizontalAlignment = PowerPoint.Alignment.center;
    }
  }
  
  // 设置周围形状（环形分布）
  const angleStep = (Math.PI * 2) / surroundingShapes.length;
  surroundingShapes.forEach((shape, index) => {
    const angle = angleStep * index - Math.PI / 2; // 从顶部开始
    const x = centerX + radius * Math.cos(angle) - 80;
    const y = centerY + radius * Math.sin(angle) - 25;
    
    shape.left = x;
    shape.top = y;
    shape.width = 160;
    shape.height = 50;
    
    // 设置字体
    if (shape.hasTextFrame && shape.textFrame && shape.textFrame.textRange) {
      const textRange = shape.textFrame.textRange;
      const font = textRange.font;
      font.name = '微软雅黑';
      font.size = 14;
      font.bold = false;
      font.color = template.titleColor;
      textRange.paragraphFormat.horizontalAlignment = PowerPoint.Alignment.center;
    }
  });
  
  await context.sync();
}

// ===== 排版推荐 =====
interface LayoutRecommendation {
  name: string
  bgColor: string
  titleColor: string
  subtitleColor: string
  layoutType: 'vertical' | 'horizontal' | 'center' | 'circular' | 'left' | 'center-bottom'
  decorator: string
}

const selectedLayout = ref<number | null>(null)

// 所有可用的排版模板
const allLayoutTemplates: LayoutRecommendation[] = [
  // 1. 上下布局 - 标题在上，内容在下
  {
    name: '上下布局',
    bgColor: '#ffffff',
    titleColor: '#222',
    subtitleColor: '#666',
    layoutType: 'vertical',
    decorator: `
      <div style="position:absolute;top:0;left:0;right:0;height:45%;border-bottom:1px dashed #e5e5e5;"></div>
      <div style="position:absolute;top:20%;left:50%;transform:translate(-50%,-50%);width:60%;text-align:center;">
        <div style="font-size:20px;font-weight:bold;color:#222;">标题区域</div>
      </div>
      <div style="position:absolute;top:60%;left:10%;right:10%;">
        <div style="font-size:14px;color:#666;">内容区域</div>
      </div>
    `,
  },
  // 2. 左右布局 - 标题在左，内容在右
  {
    name: '左右布局',
    bgColor: '#f8f9fa',
    titleColor: '#1890ff',
    subtitleColor: '#555',
    layoutType: 'horizontal',
    decorator: `
      <div style="position:absolute;top:0;bottom:0;left:0;width:35%;border-right:2px solid #1890ff;background:#fff;"></div>
      <div style="position:absolute;top:50%;left:17.5%;transform:translate(-50%,-50%);width:28%;text-align:center;">
        <div style="font-size:18px;font-weight:bold;color:#1890ff;">标题</div>
      </div>
      <div style="position:absolute;top:15%;left:40%;right:8%;bottom:15%;">
        <div style="font-size:13px;color:#555;">内容区域</div>
      </div>
    `,
  },
  // 3. 居中布局 - 标题和内容都居中
  {
    name: '居中布局1',
    bgColor: '#1a1a2e',
    titleColor: '#fff',
    subtitleColor: '#aaa',
    layoutType: 'center',
    decorator: `
      <svg width="100%" height="100%" viewBox="0 0 160 90" preserveAspectRatio="xMidYMid meet" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:100px;height:100px;opacity:0.2;">
        <circle cx="50" cy="45" r="45" fill="none" stroke="#fff" stroke-width="1"/>
        <circle cx="50" cy="45" r="35" fill="none" stroke="#fff" stroke-width="0.5"/>
        <circle cx="50" cy="45" r="25" fill="none" stroke="#fff" stroke-width="0.3"/>
      </svg>
      <div style="position:absolute;top:35%;left:50%;transform:translate(-50%,-50%);width:80%;text-align:center;">
        <div style="font-size:24px;font-weight:bold;color:#fff;margin-bottom:10px;">居中标题</div>
        <div style="font-size:14px;color:#aaa;">副标题或描述</div>
      </div>
    `,
  },
  // 4. 环形布局 - 内容围绕中心排列
  {
    name: '环形布局',
    bgColor: '#fff',
    titleColor: '#333',
    subtitleColor: '#888',
    layoutType: 'circular',
    decorator: `
      <svg width="100%" height="100%" viewBox="0 0 160 90" preserveAspectRatio="xMidYMid meet" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:120px;height:120px;">
        <circle cx="60" cy="60" r="40" fill="none" stroke="#1890ff" stroke-width="2"/>
        <circle cx="60" cy="60" r="25" fill="#1890ff" opacity="0.1"/>
        <circle cx="60" cy="60" r="8" fill="#1890ff"/>
      </svg>
      <div style="position:absolute;top:45%;left:50%;transform:translate(-50%,-50%);width:14px;height:14px;border-radius:50%;background:#1890ff;"></div>
      <div style="position:absolute;top:20%;left:50%;transform:translateX(-50%);font-size:12px;color:#333;font-weight:bold;">顶部</div>
      <div style="position:absolute;top:50%;right:8%;transform:translateY(-50%);font-size:12px;color:#333;font-weight:bold;">右侧</div>
      <div style="position:absolute;bottom:20%;left:50%;transform:translateX(-50%);font-size:12px;color:#333;font-weight:bold;">底部</div>
      <div style="position:absolute;top:50%;left:8%;transform:translateY(-50%);font-size:12px;color:#333;font-weight:bold;">左侧</div>
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

// 将对齐方式转为 PowerPoint API 枚举字符串
function toPowerPointAlignment(value: string): string {
  switch (value) {
    case 'center': return 'Center'
    case 'right': return 'Right'
    case 'left': default: return 'Left'
  }
}

// 通用的 PowerPoint 格式应用函数：通过 PowerPoint.run API 直接操作选中文本
async function applyFormatToSelectedText(applyFn: (font: any, paragraphFormat: any) => void, successMsg: string) {
  if (!isOfficeContext() || isReadingFromPPT) return

  const Office = getOfficeContext()
  const PowerPoint = Office.PowerPoint || (globalThis as any).PowerPoint
  if (!PowerPoint) {
    ElMessage.warning('PowerPoint API 不可用')
    return
  }

  try {
    await PowerPoint.run(async (context: any) => {
      const selectedTextRange = context.presentation.getSelectedTextRange()
      context.load(selectedTextRange, 'text')
      await context.sync()

      if (!selectedTextRange.text || !selectedTextRange.text.trim()) {
        ElMessage.warning('请先在PowerPoint中选中文本')
        return
      }

      const font = selectedTextRange.font
      const paragraphFormat = selectedTextRange.paragraphFormat
      applyFn(font, paragraphFormat)
      await context.sync()

      ElMessage.success(successMsg)
    })
  } catch (error: any) {
    console.error('应用格式失败:', error)
    ElMessage.error('应用格式失败: ' + (error.message || error))
  }
}

// 监听字体大小变化，同步到PowerPoint
watch(fontSize, async (newSize) => {
  await applyFormatToSelectedText(
    (font) => { font.size = newSize },
    '字体大小已调整为: ' + newSize
  )
})

// 监听字体家族变化，同步到PowerPoint
watch(fontFamily, async (newFamily) => {
  await applyFormatToSelectedText(
    (font) => { font.name = newFamily },
    '字体家族已调整为: ' + newFamily
  )
})

// 监听粗体变化，同步到PowerPoint
watch(isBold, async (newBold) => {
  await applyFormatToSelectedText(
    (font) => { font.bold = newBold },
    newBold ? '粗体已开启' : '粗体已关闭'
  )
})

// 监听对齐方式变化，同步到PowerPoint
watch(align, async (newAlign) => {
  await applyFormatToSelectedText(
    (_font, paragraphFormat) => { paragraphFormat.horizontalAlignment = toPowerPointAlignment(newAlign) },
    '对齐方式已调整为: ' + newAlign
  )
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
