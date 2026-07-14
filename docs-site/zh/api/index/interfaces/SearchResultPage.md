[@caoergou/windows-xp](/windows-xp/docs/zh/api/index.md) / [index](/windows-xp/docs/zh/api/index/index.md) / SearchResultPage

# Interface: SearchResultPage

Defined in: src/apps/InternetExplorer/types.ts:24

One authored page in a scenario's in-world "web" (#219 / #134). It surfaces in
the search engine (see `searchCorpus`) and, when the player clicks through,
IE renders its `html` as the landing page. `match` lists the query terms that
surface it (case-insensitive substring against the query).

## Properties

### html?

&gt; `optional` **html?**: `string`

Defined in: src/apps/InternetExplorer/types.ts:31

The landing page rendered when the result is opened (IE's authored-html path).

---

### id

&gt; **id**: `string`

Defined in: src/apps/InternetExplorer/types.ts:25

---

### match

&gt; **match**: `string`[]

Defined in: src/apps/InternetExplorer/types.ts:32

---

### snippet?

&gt; `optional` **snippet?**: `string`

Defined in: src/apps/InternetExplorer/types.ts:29

---

### title

&gt; **title**: `string`

Defined in: src/apps/InternetExplorer/types.ts:26

---

### url

&gt; **url**: `string`

Defined in: src/apps/InternetExplorer/types.ts:28

The URL the result links to; clicking navigates IE here.
