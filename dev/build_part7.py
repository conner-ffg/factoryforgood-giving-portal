#!/usr/bin/env python3
"""Assemble part7_all.js: v2 layer + globe + briefs + donors + tools hub.
Tools hub embeds the three standalone tool documents as JSON literals."""
import json, re

polys = open('polys.json').read()

# ---- build the three embedded tool documents ----
atlas = open('tools/atlas.html').read()
gauge = open('tools/gauge.html').read()

# The impact-approach guide is a React component. Precompile the JSX to plain
# JS at build time (TypeScript transpiler), so the shell only needs React CDN.
import subprocess, os
tsx = open('tools/approach.tsx').read()
tsx = re.sub(r'^import .*?;\s*$', '', tsx, flags=re.M)              # strip imports
tsx = tsx.replace('export default function App()', 'function App()')  # unwrap export
assert 'function App()' in tsx
open('/tmp/approach_src.tsx', 'w').write(
    'const {useState,useEffect,useRef} = React;\n' + tsx +
    "\nReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));\n")
npm_root = subprocess.run(['npm', 'root', '-g'], capture_output=True, text=True).stdout.strip()
node_prog = (
    "const ts=require(process.argv[1]+'/typescript');const fs=require('fs');"
    "const src=fs.readFileSync('/tmp/approach_src.tsx','utf8');"
    "const out=ts.transpileModule(src,{fileName:'app.tsx',compilerOptions:{jsx:'react',target:'ES2017',module:'None'}});"
    "fs.writeFileSync('/tmp/approach_compiled.js',out.outputText);console.log('compiled',out.outputText.length);"
)
r = subprocess.run(['node', '-e', node_prog, npm_root], capture_output=True, text=True)
assert r.returncode == 0, r.stderr[:400]
r2 = subprocess.run(['node', '--check', '/tmp/approach_compiled.js'], capture_output=True, text=True)
assert r2.returncode == 0, r2.stderr[:400]
compiled = open('/tmp/approach_compiled.js').read()
approach = """<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>The Impact Approach</title>
<style>
:root{
  --color-background-primary:#FFFFFF; --color-background-secondary:#F7F5F1;
  --color-border-tertiary:#E4E1DB; --color-border-secondary:#CFCCC5;
  --color-text-primary:#141413; --color-text-secondary:#6E6C66;
  --border-radius-lg:12px; --border-radius-md:9px;
  --font-sans:'Inter',system-ui,-apple-system,sans-serif;
  --font-serif:Georgia,'Times New Roman',serif;
}
html,body{margin:0;background:var(--color-background-primary)}
*{box-sizing:border-box}
</style>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"></script>
</head><body><div id="root">
<p style="font-family:Georgia,serif;color:#6E6C66;padding:40px;text-align:center">Loading the guide… (requires an internet connection)</p>
</div>
<script>
window.addEventListener('DOMContentLoaded', function(){
  if (!window.React || !window.ReactDOM){
    document.getElementById('root').innerHTML = '<p style="font-family:Georgia,serif;color:#6E6C66;padding:40px;text-align:center">The guide needs an internet connection to load its reader. Open this on the live site and it will appear here.</p>';
  }
});
__COMPILED__
</script></body></html>""".replace('__COMPILED__', compiled)

# ---- assemble ----
parts = []
for f in ['part7a_v2.js', 'part7b_globe.js', 'part7c_brief.js', 'part7d_donors.js', 'part8_tools.js', 'part9_visits.js', 'part10_pipeline.js']:
    s = open(f).read()
    if f == 'part7b_globe.js':
        assert '__POLYS__' in s
        s = s.replace('__POLYS__', polys)
    if f == 'part8_tools.js':
        for ph, doc in (('__TOOL_ATLAS__', atlas), ('__TOOL_GAUGE__', gauge), ('__TOOL_APPROACH__', approach)):
            assert ph in s, ph
            # escape "</" so embedded </script> tags can't terminate the host script
            s = s.replace(ph, json.dumps(doc).replace('</', '<\\/'))
    parts.append(s)
out = '\n'.join(parts)
assert '__TOOL_' not in out and '__POLYS__' not in out
open('part7_all.js', 'w').write(out)
print('part7_all.js', len(out)//1024, 'KB')
