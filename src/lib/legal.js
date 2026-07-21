// 隐私政策与免责声明的结构化文案（zh / en）。
// 每个 section: { heading, paragraphs: [string], list?: [string] }
// paragraphs / list 项允许包含 <strong> 标签（静态可信内容，页面使用 v-html 渲染）。

export const privacy = {
  zh: [
    {
      heading: '一、我们收集的信息',
      paragraphs: [
        '本工具是一个<strong>纯前端开源应用</strong>，不设置任何服务器、不要求注册账号，也<strong>不会主动收集您的任何个人信息</strong>（如姓名、手机号、邮箱、位置等）。'
      ]
    },
    {
      heading: '二、数据存储位置',
      paragraphs: [
        '您添加的站点名称、账号与密钥（Secret）仅保存在<strong>您当前设备浏览器的本地存储（localStorage）</strong>中，不会上传到任何服务器或第三方。'
      ]
    },
    {
      heading: '三、数据如何使用',
      paragraphs: [
        '所有 TOTP 验证码均在您的设备本地，使用 Web Crypto 标准接口实时计算生成，<strong>不会向外部网络发送任何站点数据</strong>。本工具除加载静态资源外，不进行任何额外的网络请求。'
      ]
    },
    {
      heading: '四、第三方组件',
      paragraphs: [
        '本工具使用了 Vue、Vant、qrcode、jsQR 等开源前端库，均仅在前端运行，不涉及数据上报。静态资源由您所选择的托管服务商提供，其可能依据自身政策记录访问日志，请以托管方隐私政策为准。'
      ]
    },
    {
      heading: '五、数据安全风险与备份',
      paragraphs: [
        '由于数据仅存于本地，以下情况可能导致数据丢失且<strong>无法恢复</strong>：'
      ],
      list: [
        '清理微信 / 浏览器缓存或网站数据；',
        '在隐私 / 无痕模式下使用（该模式不持久化存储）；',
        '卸载微信、清除应用数据或更换设备。'
      ]
    },
    {
      heading: '六、您的权利',
      paragraphs: [
        '您对自己的数据拥有完全控制权：可随时通过「导出备份」复制数据，或通过「导入备份」恢复数据；清除本站点浏览器数据即可立即删除全部本地信息。'
      ]
    },
    {
      heading: '七、联系我们',
      paragraphs: [
        '如对本隐私政策有疑问，可通过项目仓库 Issue 与我们联系。'
      ]
    },
    {
      heading: '八、政策更新',
      paragraphs: [
        '我们可能随功能迭代更新本政策。重大变更将在应用内或以适当方式提示，更新后条款自发布之日起生效。'
      ]
    }
  ],
  en: [
    {
      heading: '1. Information We Collect',
      paragraphs: [
        'This tool is a <strong>pure front-end open-source application</strong>. It runs no server, requires no account registration, and <strong>does not actively collect any of your personal information</strong> (such as name, phone number, email, or location).'
      ]
    },
    {
      heading: '2. Data Storage Location',
      paragraphs: [
        'The site names, accounts, and secrets you add are stored only in the <strong>local storage (localStorage) of your current device browser</strong>. They are never uploaded to any server or third party.'
      ]
    },
    {
      heading: '3. How Data Is Used',
      paragraphs: [
        'All TOTP codes are computed locally on your device in real time using the standard Web Crypto API. <strong>No site data is ever sent over the network</strong>. Besides loading static assets, the app makes no additional network requests.'
      ]
    },
    {
      heading: '4. Third-Party Components',
      paragraphs: [
        'This tool uses open-source front-end libraries such as Vue, Vant, qrcode, and jsQR, all of which run only in the browser and do not report data. Static assets are served by your chosen hosting provider, which may log access per its own policy — please refer to that provider’s privacy policy.'
      ]
    },
    {
      heading: '5. Data Security Risks & Backup',
      paragraphs: [
        'Because data lives only on your device, the following situations may cause <strong>irrecoverable</strong> data loss:'
      ],
      list: [
        'Clearing WeChat/browser cache or site data;',
        'Using private/incognito mode (storage is not persisted);',
        'Uninstalling WeChat, clearing app data, or switching devices.'
      ]
    },
    {
      heading: '6. Your Rights',
      paragraphs: [
        'You have full control over your data: you can copy it anytime via "Export Backup", or restore it via "Import Backup". Clearing this site’s browser data deletes all local information immediately.'
      ]
    },
    {
      heading: '7. Contact Us',
      paragraphs: [
        'If you have any questions about this privacy policy, please reach out through the project repository Issues.'
      ]
    },
    {
      heading: '8. Policy Updates',
      paragraphs: [
        'We may update this policy as features evolve. Material changes will be announced in-app or by other appropriate means, and updated terms take effect upon publication.'
      ]
    }
  ]
}

export const disclaimer = {
  zh: [
    {
      heading: '一、服务按「现状」提供',
      paragraphs: [
        '本工具按<strong>「原样」（AS IS）</strong>提供，我们尽力保证其功能正确与稳定，但<strong>不保证绝对无误、不间断或适用于所有场景</strong>。使用的风险由您自行承担。'
      ]
    },
    {
      heading: '二、密钥与账户安全',
      paragraphs: ['两步验证密钥等同于您账户的「最高权限凭证」。请务必：'],
      list: [
        '妥善保管本地数据与备份文件，避免泄露、截屏外传；',
        '仅在信任的设备上使用本工具；',
        '设备丢失、密钥泄露或缓存被清理导致无法登录时，责任由您自行承担。'
      ]
    },
    {
      heading: '三、与任何服务商的无关性',
      paragraphs: [
        '本工具为独立开源项目，<strong>非任何网站、平台或服务商的官方产品</strong>，与 GitHub、Google、AWS 等第三方无任何关联，也不代表其立场。'
      ]
    },
    {
      heading: '四、使用范围',
      paragraphs: [
        '本工具仅供个人学习、研究与非商业性的自用场景。如用于任何形式的商业用途，您应自行评估并确保符合所在地法律法规及相应服务条款。'
      ]
    },
    {
      heading: '五、责任限制',
      paragraphs: [
        '在法律允许的最大范围内，对于因使用或无法使用本工具所导致的任何直接或间接损失（包括但不限于账户被盗、数据丢失、业务中断等），<strong>我们不承担任何责任</strong>。'
      ]
    },
    {
      heading: '六、合规使用',
      paragraphs: [
        '您应遵守所在地法律法规及所使用网站的服务条款。若您的行为违反相关规定，相应后果由您自行承担。'
      ]
    }
  ],
  en: [
    {
      heading: '1. Service Provided "As Is"',
      paragraphs: [
        'This tool is provided <strong>"AS IS"</strong>. We strive to keep it correct and stable, but <strong>do not guarantee it is error-free, uninterrupted, or suitable for every scenario</strong>. Use it at your own risk.'
      ]
    },
    {
      heading: '2. Secrets & Account Security',
      paragraphs: ['A two-factor secret is equivalent to the "highest-privilege credential" for your account. Please:'],
      list: [
        'Safeguard local data and backup files; avoid leaks or screenshots shared externally;',
        'Use this tool only on trusted devices;',
        'You alone are responsible if a lost device, leaked secret, or cleared cache prevents login.'
      ]
    },
    {
      heading: '3. Independence from Any Provider',
      paragraphs: [
        'This tool is an independent open-source project, <strong>not an official product of any website, platform, or provider</strong>. It has no affiliation with third parties such as GitHub, Google, or AWS, and does not represent their positions.'
      ]
    },
    {
      heading: '4. Scope of Use',
      paragraphs: [
        'This tool is intended for personal learning, research, and non-commercial self-use. If you use it for any commercial purpose, you are responsible for ensuring compliance with applicable laws and the relevant terms of service.'
      ]
    },
    {
      heading: '5. Limitation of Liability',
      paragraphs: [
        'To the maximum extent permitted by law, we <strong>accept no liability</strong> for any direct or indirect loss arising from the use of or inability to use this tool (including but not limited to account compromise, data loss, or business interruption).'
      ]
    },
    {
      heading: '6. Compliance',
      paragraphs: [
        'You must comply with applicable laws and the terms of the websites you use. Any consequences of violating such rules are your sole responsibility.'
      ]
    }
  ]
}
