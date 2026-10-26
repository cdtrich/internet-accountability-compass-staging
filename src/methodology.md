<!-- import externals -->
<head>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,100..900;1,100..900&family=Nunito+Sans:ital,opsz,wght@0,6..12,200..1000;1,6..12,200..1000&family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css">
<!-- sidebar -->
    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
    />
    <link rel="stylesheet" href="sidebar.css" />
</head>

<!-- back to root button -->

<!-- <a href="../" class="back-to-root">
  <span class="arrow"></span>
</a> -->

<!-- import components -->

```js
// import { colorScales } from "./components/scales.js";
// import { onlyUnique } from "./components/onlyUnique.js";
// import { polarPlotMultiple } from "./components/polarPlotMultiple.js";
// import { mapPillar } from "./components/mapPillar.js";
// import { mapTotal } from "./components/mapTotal.js";
// import { mapTotalScorecard } from "./components/mapTotalScorecard.js";
// import { mapTotalCatGIFIquant5 } from "./components/mapTotalCatGIFIquant5.js";
// import { mapPillarCommitment } from "./components/mapPillarCommitment.js";
import { sidebar } from "./components/sidebar.js";
```

<!-- hero -->

<div class="hero">
  <h1>Methodology</h1>
  <!-- <div id="hero-image"></div> -->
  </div>
<div class="body-text">
  <p>The Internet Accountability Compass provides <b>a structured, comparative view of how countries are implementing key digital policy commitments</b> that shape the governance and experience of the Internet. It draws on selected, publicly available datasets and indices to promote transparency, support self-assessment, and enable peer learning—rather than ranking or naming and shaming.
  </p>
  <p>The authors recognise that the Compass reflects <b>only one of several valid approaches</b> to combining and interpreting available data. It is not intended as a categorical assessment of national performance, but rather as a tool to initiate reflection and dialogue on how Internet accountability can be assessed, understood, and strengthened over time.
</p>
<h2>Framework</h2>
  <p>The Compass is organised around four core dimensions:
</p>
<ol>
<li>Connectivity and infrastructure

</li>
<li>Rights and freedoms

</li>
<li>Responsibility and sustainability

</li>
<li>Trust and resilience

</li>
</ol>
  <p>These dimensions reflect widely recognised principles and commitments articulated in international political declarations, including the <a href="https://www.un.org/digital-emerging-technologies/global-digital-compact" target="_blank">
Global Digital Compact</a> and the <a href="https://digital-strategy.ec.europa.eu/en/library/declaration-future-internet" target="_blank">Declaration on the Future of the Internet</a>. For a full mapping of commitments and their relevance to the Compass framework, see <a href="https://mozilla.github.io/pdf.js/web/viewer.html?file=https://raw.githubusercontent.com/cdtrich/internet-accountability-compass/e81b97ed32a055ae7a709ca7daf6f8adbcb39094/src/data/sources/Methodological_Note_1.pdf" target="_blank"> Methodological Note 1</a>.

</p>
  <p>Given the methodological complexity and time constraints involved in producing original data, each dimension is informed by established external sources that capture legal, institutional, and practical conditions across countries.
</p>
<h2>Data sources</h2>
  <p>The Compass draws on established global indices and datasets, selected for their transparency, methodological rigour, and regular updates. These include:
</p>
<ol>
<li>ICT Development Index, Network Readiness Index, and data on Internet shutdowns for <b>connectivity and infrastructure</b>;
</li>
<li>Freedom on the Net, Freedom in the World Index, and Rule of Law Index for <b>rights and freedoms</b>;
</li>
<li>Global Index on Responsible AI, Digital Trade and Integration Index, and Global E-Waste Monitor for <b>responsibility and sustainability</b>;
</li>
<li>Global Cybersecurity Index, Internet Society's Resilience Index, and Accountability Index for <b>trust and resilience</b>.
</li>
</ol>
<p>Each source provides a distinct perspective, capturing dimensions such as legal guarantees, digital inclusion, environmental sustainability, and institutional trust.</p>
<p>Indicators were selected based on global coverage, thematic relevance, methodological transparency, and frequency of updates. Preference was given to sources used in international reporting or aligned with multilateral digital policy frameworks.
</p>
<p>The methodology is framed in global terms, but different regions and income levels face vastly different challenges. This might lead to perceptions of unfair comparison. Therefore, while the Compass applies a universal framework, interpretation of results should consider national contexts, including levels of development, institutional capacity, and regional policy environments.
</p>
<h2>Aggregation and categorisation
</h2>
  <p>The Compass does not generate composite scores or global rankings. Instead, it employs a directional assessment framework, categorising countries into four levels of progress within each dimension:
</p>

<ol>
  <li><b>Leading</b> (Score 100-80): Demonstrating strong leadership, innovation, or exemplary practices.
  </li>
  <li><b>On Track</b> (79-65): Policies aligned with global objectives and showing steady implementation.
  </li>
  <li><b>Catching Up</b> (64-50): Early efforts visible, though progress remains limited or uneven.
  </li>
  <li><b>Off track</b> (49-0): Divergence from international norms or significant implementation gaps, reliable data might be missing.
  </li>
</ol>
  <p>These categories are derived through comparative analysis and qualitative interpretation of underlying data across multiple indicators.
</p>
  <h2>Composition and scoring
</h2>
  <p>The Compass comprises 12 secondary indicators, grouped into the four directional categories.
</p>
<ol>
<li>The <b>Total Score</b> is calculated as the equally weighted average of all available indicators. Countries with data for fewer than 8 of the 12 indicators are excluded from total scoring.
</li>
<li>A <b>Directional Score</b> reflects the average of the three indicators within a given category. All 3 indicators are required for a directional score to be assigned.
</li>
<li><b>Partial Data</b> indicates that a country is missing one or more indicators in a given category. Countries with only partial data may be skewed and should be evaluated solely based on existing indicators.
</ol>
  <p>As the Compass relies on secondary data, results may be influenced by variations in methodology, data quality, or temporal gaps between sources. While directional assessments offer comparative insights, they do not capture the full nuance of local implementation or informal practices.
</p>
  <p>All indicator sources, any modifications made to original datasets, and detailed scoring methodology are documented in <a href="https://mozilla.github.io/pdf.js/web/viewer.html?file=https://raw.githubusercontent.com/cdtrich/internet-accountability-compass/e81b97ed32a055ae7a709ca7daf6f8adbcb39094/src/data/sources/Methodological Note 2.pdf" target="_blank"> Methodological Note 2</a>. The approach used to construct historical scores for the period 2020–2024, including source selection, gap-filling, and cross-year comparability, is documented in <a href="https://mozilla.github.io/pdf.js/web/viewer.html?file=https://raw.githubusercontent.com/cdtrich/internet-accountability-compass/d97bdf460b11bf59722afbbf3695f816a0bf1b07/src/data/sources/Methodological_Note_4.pdf" target="_blank"> Methodological Note 4</a>. The Compass is updated periodically, subject to the availability of new data, methodological refinements and resources.
</p>
  <p>Although indicators are weighted equally in score calculations, we acknowledge that overlapping variables across indices may result in implicit weighting effects. <a href="https://raw.githubusercontent.com/cdtrich/internet-accountability-compass/d97bdf460b11bf59722afbbf3695f816a0bf1b07/src/data/sources/Methodological_Note_3.xlsx" target="_blank">Methodological Note 3</a> explains these overlaps and potential biases.
</p>
<p><a href="https://github.com/cdtrich/internet-accountability-compass/raw/refs/heads/main/src/data/Internet_Accountability_Index-V2.1.xlsx" target="_blank">Download the dataset</a>.</p>
<h2>Feedback</h2>
<p>The authors welcome feedback and suggestions to improve the Compass. To contribute, please contact: <a href="mailto:gifi@eui.eu">gifi@eui.eu</a></p>
<h2>Disclaimer</h2>
<p>The Internet Accountability Compass was developed by a research team of the Global Initiative on the Future of the Internet at the European University Institute. The content reflects the views of its authors and does not represent the official position of the European Union or any of its institutions.</p>

<!-- funding -->
  <div class="grid grid-cols-4 gap-4">
  <div>
    <img class="keystats" src="https://ec.europa.eu/regional_policy/images/information-sources/logo-download-center/eu_funded_en.jpg" width="100%">
  </div>
  <div class="col-span-3">
  </div>
  </div>

</div>

<!-- sidebar -->

<div>
    ${sidebar()}
</div>
