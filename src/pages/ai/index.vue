<template>
  <div class="main-panel home-content">
    <div class="home-card" @click="navigateTo('/ai/generate')">
      <div class="home-card-icon">
        <svg viewBox="0 0 48 48" width="36" height="36" fill="none">
          <rect x="8" y="6" width="32" height="36" rx="3" stroke="#e8b86d" stroke-width="2" fill="#fff9f0"/>
          <line x1="14" y1="16" x2="34" y2="16" stroke="#e8b86d" stroke-width="2"/>
          <line x1="14" y1="22" x2="30" y2="22" stroke="#ddd" stroke-width="1.5"/>
          <line x1="14" y1="27" x2="26" y2="27" stroke="#ddd" stroke-width="1.5"/>
          <circle cx="34" cy="30" r="7" fill="#ff6b6b"/>
          <path d="M31 30l2 2 4-4" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="home-card-title">一键生成PPT</div>
      <div class="home-card-desc">输入主题，AI帮您快速生成完整演示文稿</div>
    </div>

    <div class="home-card" @click="navigateTo('/ai/optimize')">
      <div class="home-card-icon">
        <svg viewBox="0 0 48 48" width="36" height="36" fill="none">
          <path d="M24 6l4.5 9 10 1.5-7 7 1.5 10L24 29l-9 4.5 1.5-10-7-7 10-1.5L24 6z" fill="#ffd666" stroke="#e8b86d" stroke-width="1.5"/>
          <circle cx="33" cy="14" r="5" fill="#69b1ff" stroke="#4a9eff" stroke-width="1"/>
        </svg>
      </div>
      <div class="home-card-title">内容优化</div>
      <div class="home-card-desc">选中文本后进行智能改写</div>
    </div>

    <div class="home-card" @click="navigateTo('/ai/image')">
      <div class="home-card-icon">
        <svg viewBox="0 0 48 48" width="36" height="36" fill="none">
          <ellipse cx="24" cy="28" rx="16" ry="12" fill="#ffd6e7" stroke="#ff85c0" stroke-width="1.5"/>
          <circle cx="18" cy="26" r="3" fill="#ff85c0"/>
          <circle cx="28" cy="24" r="4" fill="#ffadd2"/>
          <circle cx="24" cy="30" r="2.5" fill="#ff85c0"/>
          <path d="M20 15l3-5 3 5 5-2-1 6h-14l-1-6 5 2z" fill="#ffadd2" stroke="#ff85c0" stroke-width="1"/>
        </svg>
      </div>
      <div class="home-card-title">AI生图</div>
      <div class="home-card-desc">AI生成图片素材</div>
    </div>

    <div class="home-card" @click="navigateTo('/ai/layout')">
      <div class="home-card-icon">
        <svg viewBox="0 0 48 48" width="36" height="36" fill="none">
          <path d="M8 38V10l16 14L40 10v28H8z" fill="#e8e8e8" stroke="#bbb" stroke-width="1.5" stroke-linejoin="round"/>
          <line x1="8" y1="38" x2="40" y2="38" stroke="#aaa" stroke-width="2"/>
          <line x1="24" y1="24" x2="24" y2="38" stroke="#ccc" stroke-width="1" stroke-dasharray="3 2"/>
        </svg>
      </div>
      <div class="home-card-title">排版优化</div>
      <div class="home-card-desc">统一格式，美化布局</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function navigateTo(path: string) {
  router.push(path)
}
</script>

<style scoped>
.home-content {
  flex: 1;
  overflow: hidden;
  padding: 20px 0;
  display: flex;
  flex-direction: column;
  /* gap: 20px; */
}

.main-panel {
  display: flex;
  flex-direction: column;
  background: #fff;
}

.home-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 0;
  gap: 10px;
  cursor: pointer;
  border: 1.5px solid #f0f0f0;
  border-radius: 12px;
  margin: 8px 16px;
  transition: background 0.15s, border-color 0.15s;
}

.home-card:hover { background: #fafafa; border-color: #e0e0e0; }

.home-card-icon {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.home-card-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.home-card-desc {
  font-size: 13px;
  color: #aaa;
}
</style>
