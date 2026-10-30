# FACTS — 窄门 · 霍尔木兹海峡

## 实测（本片自己量的）

| 读数 | 数值 | 方法 |
|---|---|---|
| 海峡最窄处 | 38.6 km（大昆岛 Great Quoin, 阿曼 ↔ 拉腊克岛 Larak, 伊朗） | Landsat 8/9 C2 L2 合成（LC09_L2SP_159042_20250125、LC08_L2SP_160041/160042_20250124、LC09_L2SP_159041_20250125），MNDWI(green, swir16) > 0 为水；陆地连通域 ≥ 150 像元（13 ha，排除船只和礁石）；两岸陆地边缘最近距离，大圆距离 38.61 km。`tools/measure.py` → `assets/measure.json`。与"21 海里（≈ 38.9 km）"的常见说法一致；EIA 原文写作 "21 miles"，即常被转述的"33 公里"，本片不用。 |
| 开场船长 | ≈ 320 m（宽 ≈ 86 m，含 10 m 像元的模糊） | Sentinel-2 L2A S2C_MSIL2A_20250221T064931_R020_T40RDQ，B08 > 0.03 的连通域主轴长度；位置 56.4955°E, 26.5453°N。320 m 与超大型油轮（VLCC，约 330 m）的尺寸相当；片中只说"这是超大型油轮的尺寸"，不断言船型和载货。 |
| 航道位置 | 两行船只，分隔带中心约 26.571°N（56.4°E），向东略升 | 同一景 Sentinel-2 上识别出的 18 艘船（`assets/s2ships.json`）；航道画成示意的海图层（蓝色虚线），宽度取 EIA 的 2 英里。 |

## 引用（EIA, *Amid regional conflict, the Strait of Hormuz remains critical oil chokepoint*, 2025-06-16）

URL: https://www.eia.gov/todayinenergy/detail.php?id=65504

| 片中说法 | 原文 |
|---|---|
| 2024 年平均每天 2000 万桶，约占全球石油消费五分之一 | "In 2024, oil flow through the strait averaged 20 million barrels per day (b/d), or the equivalent of about 20% of global petroleum liquids consumption." |
| 全球约五分之一的液化天然气，主要来自卡塔尔 | "around one-fifth of global liquefied natural gas trade also transited the Strait of Hormuz in 2024, primarily from Qatar." |
| 断航时可调用的绕行余量约 260 万桶/天 | "we estimate that about 2.6 million b/d of capacity from the Saudi and UAE pipelines could be available to bypass the Strait of Hormuz in the event of a supply disruption." |
| 约为日常运量的 13% | 2.6 ÷ 20 = 13 %（本片推算） |
| 东西管道（阿布盖格 → 延布）、阿联酋管道（→ 富查伊拉） | "Saudi Aramco operates the 5 million-b/d East-West crude oil pipeline, which runs from the Abqaiq oil processing center near the Persian Gulf to the Yanbu port on the Red Sea." / "This 1.8 million-b/d pipeline links onshore oil fields to the Fujairah export terminal in the Gulf of Oman." |
| 84% 运往亚洲；中国、印度、日本、韩国为最大买家 | "We estimate that 84% of the crude oil and condensate … went to Asian markets in 2024. China, India, Japan, and South Korea were the top destinations…" |
| 每条航道约 3 公里宽 | EIA, *World Oil Transit Chokepoints*（EIA 页面为脚本渲染，未能直接抓取；引文经 Scientific American 转引：https://www.scientificamerican.com/blog/plugged-in/how-deep-is-the-strait-of-hormuz ）: "the width of the shipping lane in either direction is only two miles, separated by a two-mile buffer zone"（2 mi ≈ 3.2 km）。制作前再核一次原文。 |

## 推算

- "能装满约 10 艘这样的船"：2000 万桶/天 ÷ 约 200 万桶/艘（VLCC 典型载量）= 10。
- 航线和管道走向为示意（真实端点，路径示意），画面上标注"示意"。
