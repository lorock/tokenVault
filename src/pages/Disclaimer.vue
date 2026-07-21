<template>
  <div class="legal-page">
    <van-nav-bar title="免责声明" left-arrow :border="false" @click-left="goBack" />

    <div class="legal-body">
      <p class="legal-updated">最后更新：2026-07-21</p>

      <section class="legal-section">
        <h2>一、服务按「现状」提供</h2>
        <p>
          本工具按<strong>「原样」（AS IS）</strong>提供，我们尽力保证其功能正确与稳定，但<strong>不保证绝对无误、不间断或适用于所有场景</strong>。使用的风险由您自行承担。
        </p>
      </section>

      <section class="legal-section">
        <h2>二、密钥与账户安全</h2>
        <p>
          两步验证密钥等同于您账户的「最高权限凭证」。请务必：
        </p>
        <ul>
          <li>妥善保管本地数据与备份文件，避免泄露、截屏外传；</li>
          <li>仅在信任的设备上使用本工具；</li>
          <li>设备丢失、密钥泄露或缓存被清理导致无法登录时，责任由您自行承担。</li>
        </ul>
      </section>

      <section class="legal-section">
        <h2>三、与任何服务商的无关性</h2>
        <p>
          本工具为独立开源项目，<strong>非任何网站、平台或服务商的官方产品</strong>，与 GitHub、Google、AWS 等第三方无任何关联，也不代表其立场。
        </p>
      </section>

      <section class="legal-section">
        <h2>四、使用范围</h2>
        <p>
          本工具仅供个人学习、研究与非商业性的自用场景。如用于任何形式的商业用途，您应自行评估并确保符合所在地法律法规及相应服务条款。
        </p>
      </section>

      <section class="legal-section">
        <h2>五、责任限制</h2>
        <p>
          在法律允许的最大范围内，对于因使用或无法使用本工具所导致的任何直接或间接损失（包括但不限于账户被盗、数据丢失、业务中断等），<strong>我们不承担任何责任</strong>。
        </p>
      </section>

      <section class="legal-section">
        <h2>六、合规使用</h2>
        <p>
          您应遵守所在地法律法规及所使用网站的 service 条款。若您的行为违反相关规定，相应后果由您自行承担。
        </p>
      </section>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/')
}
</script>

<style scoped>
.legal-page {
  flex: 1 0 auto;
}
.legal-body {
  max-width: 720px;
  margin: 0 auto;
  padding: 18px 18px 32px;
}
.legal-updated {
  margin: 4px 0 18px;
  font-size: 12px;
  color: var(--text-2);
}
.legal-section {
  margin-bottom: 22px;
}
.legal-section h2 {
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 10px;
  padding-left: 10px;
  border-left: 3px solid var(--accent);
  line-height: 1.3;
}
.legal-section p {
  margin: 0 0 10px;
  font-size: 14px;
  line-height: 1.75;
  color: var(--text-2);
}
.legal-section ul {
  margin: 0 0 10px;
  padding-left: 20px;
}
.legal-section li {
  font-size: 14px;
  line-height: 1.75;
  color: var(--text-2);
  margin-bottom: 4px;
}
.legal-section strong {
  color: var(--text);
  font-weight: 600;
}
</style>
