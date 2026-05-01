# 德云相声博物馆

一个纯静态的相声馆藏站点，现已从早期模板站重构为统一的数据驱动前端。

## 现在的结构

- `index.html`：馆藏首页
- `role.html`：演员总览
- `GDG.html` / `YYP.html` / `GF.html` 等：演员详情页壳
- `scripts/rebuild_site.py`：从音频目录生成页面壳和馆藏数据
- `static/js/catalog.js`：生成后的演员与曲目数据
- `static/js/site.js`：页面渲染与播放器交互
- `static/css/site.css`：统一站点样式
- `BFQ/`：音频馆藏目录

## 如何更新页面

当你新增、删除或调整演员资料后，运行：

```powershell
python scripts\rebuild_site.py
```

这个脚本会：

- 扫描 `BFQ/` 下的音频文件
- 生成最新的 `static/js/catalog.js`
- 重写首页、演员总览页、404 页和各演员详情页壳

## 设计方向

- 更现代、更简约、更实用
- 保留中华文化气质，但避免廉价古风模板感
- 以“找演员”和“直接播放”为核心，而不是堆砌视觉组件

## 说明

- 本项目当前仍是纯静态站，适合继续部署在 GitHub Pages
- 馆藏内容仅作个人整理与学习交流使用
