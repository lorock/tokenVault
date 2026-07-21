<template>
  <div class="legal-page">
    <van-nav-bar title="隐私政策" left-arrow :border="false" @click-left="goBack" />

    <div class="legal-body">
      <p class="legal-updated">最后更新：2026-07-21</p>

      <section class="legal-section">
        <h2>一、我们收集的信息</h2>
        <p>
          本工具是一个<strong>纯前端开源应用</strong>，不设置任何服务器、不要求注册账号，也<strong>不会主动收集您的任何个人信息</strong>（如姓名、手机号、邮箱、位置等）。
        </p>
      </section>

      <section class="legal-section">
        <h2>二、数据存储位置</h2>
        <p>
          您添加的站点名称、账号与密钥（Secret）仅保存在<strong>您当前设备浏览器的本地存储（localStorage）</strong>中，不会上传到任何服务器或第三方。
        </p>
      </section>

      <section class="legal-section">
        <h2>三、数据如何使用</h2>
        <p>
          所有 TOTP 验证码均在您的设备本地，使用 Web Crypto 标准接口实时计算生成，<strong>不会向外部网络发送任何站点数据</strong>。本工具除加载静态资源外，不进行任何额外的网络请求。
        </p>
      </section>

      <section class="legal-section">
        <h2>四、第三方组件</h2>
        <p>
          本工具使用了 Vue、Vant、qrcode、jsQR 等开源前端库，均仅在前端运行，不涉及数据上报。静态资源由您所选择的托管服务商提供，其可能依据自身政策记录访问日志，请以托管方隐私政策为准。
        </p>
      </section>

      <section class="legal-section">
        <h2>五、数据安全风险与备份</h2>
        <p>
          由于数据仅存于本地，以下情况可能导致数据丢失且<strong>无法恢复</strong>：
        </p>
        <ul>
          <li>清理微信 / 浏览器缓存或网站数据；</li>
          <li>在隐私 / 无痕模式下使用（该模式不持久化存储）；</li>
          <li>卸载微信、清除应用数据或更换设备。</li>
        </ul>
        <p>
          为保障安全，建议您通过首页「导出备份」功能定期将站点导出为 JSON 文件，妥善保存于可信位置。
        </p>
      </section>

      <section class="legal-section">
        <h2>六、您的权利</h2>
        <p>
          您对自己的数据拥有完全控制权：可随时通过「导出备份」复制数据，或通过「导入备份」恢复数据；清除本站点浏览器数据即可立即删除全部本地信息。
        </p>
      </section>

      <section class="legal-section">
        <h2>七、联系我们</h2>
        <p>
          如对本隐私政策有疑问，可通过项目仓库 Issue 与我们联系。
        </p>
      </section>

      <section class="legal-section">
        <h2>八、政策更新</h2>
        <p>
          我们可能随功能迭代更新本政策。重大变更将在应用内或以适当方式提示，更新后条款自发布之日起生效。
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
