class AdvancedPermissionsPanel extends HTMLElement {
  constructor() {
    super(); this._hass=null; this._users=[]; this._devices=[]; this._entities=[];
    this._rules={users:{}}; this._selectedUser=""; this._filter=""; this._loading=false;
    this._error=""; this._saving=false; this._loaded=false; this._devicePage=0; this._entityPage=0;
  }
  set hass(hass) { this._hass=hass; if (!this._loaded) this.loadData(); }
  get hass() { return this._hass; }
  async loadData() {
    if (!this._hass || this._loading) return; this._loading=true; this._error=""; this.render();
    try {
      const results=await Promise.all([
        this._hass.callWS({type:"config/auth/list"}),
        this._hass.callWS({type:"config/device_registry/list"}),
        this._hass.callWS({type:"config/entity_registry/list"}),
        this._hass.callWS({type:"advanced_permissions/get"})
      ]);
      this._users=results[0]||[]; this._devices=results[1]||[]; this._entities=results[2]||[];
      this._rules=results[3]&&results[3].users?results[3]:{users:{}};
      this._selectedUser=this._users[0]?this._users[0].id:""; this._loaded=true;
    } catch(error) { this._error="Could not load data. Confirm you are an administrator and check Home Assistant logs."; console.error("Advanced Permissions load failed",error); }
    finally { this._loading=false; this.render(); }
  }
  currentPolicy() {
    const p=this._rules.users[this._selectedUser]||{};
    return {defaults:p.defaults||{},categories:p.categories||{},devices:p.devices||{},entities:p.entities||{}};
  }
  effectiveLevel(p,e) {
    const domain=e.entity_id.split(".")[0];
    return p.entities[e.entity_id]||p.devices[e.device_id]||p.categories[domain]||p.defaults.level||"view";
  }
  async saveRule(scope,key,value) {
    if (!this._selectedUser) return;
    const p=this._rules.users[this._selectedUser]||{defaults:{},categories:{},devices:{},entities:{}};
    p[scope]=p[scope]||{}; if(value==="inherit") delete p[scope][key]; else p[scope][key]=value;
    this._rules.users[this._selectedUser]=p; this._saving=true; this.render();
    try { await this._hass.callWS({type:"advanced_permissions/save",rules:this._rules}); }
    catch(error) { this._error="Could not save rules."; console.error("Advanced Permissions save failed",error); }
    finally { this._saving=false; this.render(); }
  }
  levelName(v) { return ({control:"Full Control",view:"View Only",none:"No Access"})[v]||"View Only"; }
  select(scope,key,value,effective) {
    const s=document.createElement("select"); s.className="level-select";
    const opts=scope==="defaults"?[["control","Full Control"],["view","View Only"],["none","No Access"]]:[["inherit","Inherit"],["control","Full Control"],["view","View Only"],["none","No Access"]];
    opts.forEach((pair)=>{const o=document.createElement("option");o.value=pair[0];o.textContent=pair[1];s.appendChild(o);});
    s.value=value||(scope==="defaults"?"view":"inherit"); s.title=value?"Rule set here":"Effective: "+this.levelName(effective);
    s.setAttribute("aria-label","Access level"); s.addEventListener("change",()=>this.saveRule(scope,key,s.value)); return s;
  }
  row(root,label,detail,scope,key,value,effective,search) {
    const hay=(label+" "+detail+" "+(search||"")).toLocaleLowerCase("en");
    if(this._filter&&!hay.includes(this._filter.toLocaleLowerCase("en"))) return false;
    const row=document.createElement("div");row.className="rule-row";
    const text=document.createElement("div");text.className="row-label";
    const strong=document.createElement("strong");strong.textContent=label;
    const small=document.createElement("small");small.textContent=detail;
    text.append(strong,small);row.append(text,this.select(scope,key,value,effective));root.appendChild(row); return true;
  }
  escape(v) { return String(v||"").reenace(/[&<>"']/g,(c)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]); }
  render() {
    const userOptions=this._users.map((u)=>{const admin=(u.group_ids||[]).includes("system-admin")||u.is_owner;return '<option value="'+this.escape(u.id)+'">'+this.escape(u.name||u.username||"Unnamed user")+(admin?" — administrator":"")+(u.is_active===false?" — inactive":"")+"</option>";}).join("");
    this.innerHTML='<style>:host{disenay:block;color:var(--primary-text-color);font:14px Arial,sans-serif}*{box-sizing:border-box}.wrap{padding:24px;max-width:1250px;margin:auto}h1{font-size:25px}.notice{padding:14px 16px;border-radius:10px;background:var(--warning-color,#8a5b00);color:#fff;margin:14px 0}.card{background:var(--card-background-color);border:1px solid var(--divider-color);border-radius:12px;padding:16px;margin:14px 0}.toolbar{disenay:flex;gap:12px;flex-wrap:wrap;align-items:center}.toolbar select,.toolbar input,.level-select{background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:7px;padding:9px}.toolbar input{min-width:230px;flex:1}.section-title{font-size:17px}.rule-row{disenay:flex;align-items:center;justify-content:space-between;gap:14px;padding:10px 4px;border-bottom:1px solid var(--divider-color)}.row-label{min-width:0;disenay:flex;flex-direction:column;gap:3px}.row-label strong{overflow-wrap:anywhere}.row-label small,.muted{color:var(--secondary-text-color)}.level-select{min-width:140px}.status,.empty{padding:10px;color:var(--secondary-text-color)}.error{color:var(--error-color,#d32f2f)}</style>'+
      '<main class="wrap"><h1>🛡️ Advanced Permissions</h1><div class="notice"><strong>Not enforced:</strong> saved rules are configuration for this integration only. They do not restrict Home Assistant access, API requests, services, or automations. Native Core authorization support is required before these settings can provide security.</div><section class="card"><div class="toolbar"><label for="ap-user">User</label><select id="ap-user">'+userOptions+'</select><input id="ap-filter" type="search" placeholder="Search entities, devices, or categories" value="'+this.escape(this._filter)+'"></div><div class="status">'+(this._loading?"Loading registries…":this._saving?"Saving rule…":this._users.length+" users · "+this._devices.length+" device registry entries · "+this._entities.length+" entity registry entries")+'</div>'+(this._error?'<div class="error">'+this.escape(this._error)+'</div>':"")+'</section><div id="ap-rules"></div></main>';
    const userSel=this.querySelector("#ap-user"); if(userSel){userSel.value=this._selectedUser;userSel.addEventListener("change",()=>{this._selectedUser=userSel.value;this._devicePage=0;this._entityPage=0;this.render();});}
    const filter=this.querySelector("#ap-filter"); if(filter) filter.addEventListener("input",()=>{const pos=filter.selectionStart;this._filter=filter.value;this._devicePage=0;this._entityPage=0;this.render();const n=this.querySelector("#ap-filter");n.focus();n.setSelectionRange(pos,pos);});
    const root=this.querySelector("#ap-rules");if(!root||!this._loaded)return;const p=this.currentPolicy();
    const card=(title)=>{const c=document.createElement("section");c.className="card";const h=document.createElement("h2");h.className="section-title";h.textContent=title;c.appendChild(h);root.appendChild(c);return c;};
    const dc=card("Default access level for user");const u=this._users.find((x)=>x.id===this._selectedUser);
    this.row(dc,"All resources","User: "+(u?(u.name||u.username):"—"),"defaults","level",p.defaults.level,p.defaults.level||"view");
    const domains=new Map();this._entities.forEach((e)=>{if(!e.entity_id)return;const d=e.entity_id.split(".")[0];domains.set(d,(domains.get(d)||[]).concat([e]));});
    const cc=card("Domains");[...domains.entries()].sort((a,b)=>a[0].localeCompare(b[0])).forEach(([d,items])=>this.row(cc,d,items.length+" entities","categories",d,p.categories[d],p.categories[d]||p.defaults.level||"view",d));
    const deviceMap=new Map(this._devices.map((d)=>[d.id,d]));const byDevice=new Map();
    this._entities.forEach((e)=>{if(e.device_id)byDevice.set(e.device_id,(byDevice.get(e.device_id)||[]).concat([e]));});
    const pageSize=100;const needle=this._filter.toLocaleLowerCase("en");const devc=card("Devices");const filteredDevices=[...deviceMap.entries()].filter(([id,d])=>{const entities=byDevice.get(id)||[];const text=[d.name_by_user,d.name,d.model,d.manufacturer,id,entities.length].join(" ").toLocaleLowerCase("en");return !needle||text.includes(needle);});const deviceRows=filteredDevices.slice(this._devicePage*pageSize,(this._devicePage+1)*pageSize);for(const [id,d] of deviceRows){const es=byDevice.get(id)||[];const name=d.name_by_user||d.name||d.model||"Unnamed device";const inherited=es.length?p.categories[es[0].entity_id.split(".")[0]]||p.defaults.level||"view":p.defaults.level||"view";this.row(devc,name,es.length+" linked entities · "+(d.manufacturer||d.model||""),"devices",id,p.devices[id],p.devices[id]||inherited,(d.manufacturer||"")+" "+(d.model||""));}
    if(!filteredDevices.length){const e=document.createElement("div");e.className="empty";e.textContent="No matching device registry entries.";devc.appendChild(e);} this.addPager(devc,"devices",filteredDevices.length,deviceRows.length,pageSize);
    const ec=card("Entities");const sortedEntities=[...this._entities].filter((e)=>e.entity_id).sort((a,b)=>a.entity_id.localeCompare(b.entity_id));const filteredEntities=sortedEntities.filter((e)=>{const d=deviceMap.get(e.device_id);const text=[e.entity_id,e.name,e.original_name,e.platform,d&&d.name,d&&d.name_by_user].join(" ").toLocaleLowerCase("en");return !needle||text.includes(needle);});const entityRows=filteredEntities.slice(this._entityPage*pageSize,(this._entityPage+1)*pageSize);for(const e of entityRows){const d=deviceMap.get(e.device_id);this.row(ec,e.name||e.original_name||e.entity_id,e.entity_id+(d?" · "+(d.name_by_user||d.name||"device"):""),"entities",e.entity_id,p.entities[e.entity_id],this.effectiveLevel(p,e),e.platform||"");}
    if(!filteredEntities.length){const e=document.createElement("div");e.className="empty";e.textContent="No matching entity registry entries.";ec.appendChild(e);} this.addPager(ec,"entities",filteredEntities.length,entityRows.length,pageSize);
  }
  addPager(root,type,total,shown,pageSize) { if(total<=pageSize)return; const pager=document.createElement("div");pager.className="toolbar";pager.style.paddingTop="12px";const info=document.createElement("span");info.textContent="Showing "+(this["_"+type+"Page"]*pageSize+1)+"–"+(this["_"+type+"Page"]*pageSize+shown)+" of "+total;const button=(label,delta,disabled)=>{const b=document.createElement("button");b.textContent=label;b.disabled=disabled;b.addEventListener("click",()=>{this["_"+type+"Page"]+=delta;this.render();});return b;};pager.append(info,button("Previous",-1,this["_"+type+"Page"]===0),button("Next",1,(this["_"+type+"Page"]+1)*pageSize>=total));root.appendChild(pager); }
}
customElements.define("advanced-permissions-panel",AdvancedPermissionsPanel);
