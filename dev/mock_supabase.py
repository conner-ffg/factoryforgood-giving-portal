#!/usr/bin/env python3
"""Local stand-in for the small slice of the Supabase API the portal uses.
Run:  python3 dev/mock_supabase.py   (serves on http://127.0.0.1:8787)
Test users: staff@factoryforgood.com / pw  ·  member@example.com / pw
"""
import json, re, urllib.parse, itertools
from http.server import HTTPServer, BaseHTTPRequestHandler

import os
ORGS = {}
for o in json.load(open(os.path.join(os.path.dirname(__file__), 'demo-data.json')))['orgs']:
    ORGS[o['id']] = {'id': o['id'], 'data': o}

USERS = {
    'staff@factoryforgood.com': {'id': 'u-staff', 'email': 'staff@factoryforgood.com', 'role': 'staff', 'full_name': 'Sam Staff', 'pw_set': True},
    'member@example.com': {'id': 'u-member', 'email': 'member@example.com', 'role': 'member', 'full_name': 'Mia Member', 'pw_set': True},
    'member2@example.com': {'id': 'u-member2', 'email': 'member2@example.com', 'role': 'member', 'full_name': 'Noah Chen', 'pw_set': False},
}
TOKENS = {}  # token -> user
DONATIONS, COMMENTS, NOTES, SHORTLIST = [], [], {}, []
CIRCLES = {'test-circle': {'id': 'test-circle', 'name': 'Test Circle', 'description': 'Mock giving circle'}}
CIRCLE_MEMBERS = [{'circle_id': 'test-circle', 'user_id': 'u-member'},
                  {'circle_id': 'test-circle', 'user_id': 'u-member2'}]
DONOR_NOTES = {}
INVITES = []
NOTIFS = []
WF_EVENTS = []
SITE_VISIT_ITEMS = []
# From the field quarterly updates (org 1 = Fortify Health, 3 = LEEP, 2 = Suvita)
ORG_UPDATES = [
    {'id': 9001, 'org_id': 1, 'quarter': '2026-Q2', 'title': 'Twelve new mills join the fortification network',
     'summary': 'Quarterly expansion brings fortified flour within reach of 4 million more people.',
     'body': 'Fortify Health signed twelve chakki mills this quarter.\n\nIndependent laboratory checks covered every active site.',
     'link_url': 'https://fortifyhealth.global/q2-update', 'video_url': None, 'img': None, 'status': 'ready'},
    {'id': 9002, 'org_id': 3, 'quarter': '2026-Q3', 'title': 'Malawi lead-paint standard takes effect',
     'summary': 'Regulation drafted with LEEP support is now enforced; compliance sampling under way.',
     'body': 'The 90 ppm limit is now law.\n\nMarket sampling begins next month.',
     'link_url': None, 'video_url': 'https://youtube.com/watch?v=leep-malawi', 'img': None, 'status': 'ready'},
    {'id': 9003, 'org_id': 2, 'quarter': '2026-Q4', 'title': 'Immunization reminders reach a new state',
     'summary': 'Planned announcement for the Q4 rotation.',
     'body': 'Draft copy pending final numbers from the field team.',
     'link_url': None, 'video_url': None, 'img': None, 'status': 'draft'},
]
seq = itertools.count(1)

def circle_stats(cid):
    uids = {m['user_id'] for m in CIRCLE_MEMBERS if m['circle_id'] == cid}
    rows = [d for d in DONATIONS if d['user_id'] in uids]
    alloc, years = {}, {}
    ytd = planned_total = 0
    for d in rows:
        y = int(str(d['gift_date'])[:4])
        yr = years.setdefault(y, {'y': y, 'total': 0, 'planned': 0})
        if d['status'] == 'logged':
            alloc[d['org_id']] = alloc.get(d['org_id'], 0) + d['amount']
            yr['total'] += d['amount']
            if y == 2026: ytd += d['amount']
        else:
            yr['planned'] += d['amount']
            if y == 2026: planned_total += d['amount']
    return {'members': len(uids), 'ytd': ytd, 'planned_total': planned_total,
            'alloc': [{'org_id': k, 'total': v} for k, v in alloc.items()],
            'years': sorted(years.values(), key=lambda r: r['y'])}

def user_from(h):
    tok = (h.get('Authorization') or '').replace('Bearer ', '')
    return TOKENS.get(tok)

def parse_filters(qs):
    f = {}
    for k, vals in urllib.parse.parse_qs(qs).items():
        if k in ('select', 'order'): continue
        v = vals[0]
        if v.startswith('eq.'): f[k] = v[3:]
    return f

class H(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def _send(self, code, obj=None):
        body = json.dumps(obj).encode() if obj is not None else b''
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.send_header('Access-Control-Allow-Methods', '*')
        self.end_headers()
        self.wfile.write(body)
    def do_OPTIONS(self): self._send(204)
    def _body(self):
        n = int(self.headers.get('Content-Length') or 0)
        return json.loads(self.rfile.read(n) or b'{}') if n else {}

    def do_POST(self):
        p = urllib.parse.urlparse(self.path)
        if p.path == '/auth/v1/token':
            b = self._body()
            u = USERS.get((b.get('email') or '').lower())
            if not u or b.get('password') != u.get('pw', 'pw'):
                if b.get('refresh_token'):
                    for t, usr in TOKENS.items():
                        if t == b['refresh_token']: u = usr; break
                    # magic-link simulation: a token minted by the email link isn't
                    # in TOKENS yet — resolve it by the user id it encodes
                    if not u and str(b.get('refresh_token', '')).startswith('tok-'):
                        uid = b['refresh_token'][4:]
                        u = next((x for x in USERS.values() if x['id'] == uid), None)
                if not u: return self._send(400, {'error_description': 'Invalid login credentials'})
            tok = 'tok-' + u['id']
            TOKENS[tok] = u
            return self._send(200, {'access_token': tok, 'refresh_token': tok, 'expires_in': 3600, 'user': {'id': u['id'], 'email': u['email']}})
        if p.path == '/auth/v1/signup':
            b = self._body()
            e = (b.get('email') or '').lower()
            if e in USERS: return self._send(400, {'msg': 'User already registered'})
            invited = e.endswith('@factoryforgood.com') or any(i['email'].lower() == e for i in INVITES)
            if not invited: return self._send(400, {'msg': 'This portal is invite-only. Ask Factory for Good to invite ' + e})
            USERS[e] = {'id': 'u-' + e.split('@')[0], 'email': e,
                        'role': 'staff' if e.endswith('@factoryforgood.com') else 'member',
                        'full_name': (b.get('data') or {}).get('full_name', ''), 'pw': b.get('password'), 'pw_set': False, 'starter': bool((b.get('data') or {}).get('starter'))}
            return self._send(200, {'user': {'id': USERS[e]['id'], 'email': e}})
        if p.path == '/auth/v1/otp':
            b = self._body()
            e = (b.get('email') or '').lower()
            if e.endswith('@factoryforgood.com') or e in USERS: return self._send(200, {})
            return self._send(400, {'msg': 'This portal is invite-only. Ask Factory for Good to invite ' + e})
        if p.path == '/auth/v1/logout': return self._send(204)
        if p.path == '/rest/v1/rpc/network_alloc':
            agg = {}
            for d in DONATIONS:
                if d['status'] == 'logged':
                    agg.setdefault(d['org_id'], [0, set()])
                    agg[d['org_id']][0] += d['amount']; agg[d['org_id']][1].add(d['user_id'])
            return self._send(200, [{'org_id': k, 'total': v[0], 'donors': len(v[1])} for k, v in agg.items()])
        if p.path == '/rest/v1/rpc/network_members':
            return self._send(200, sum(1 for u in USERS.values() if u['role'] == 'member'))
        if p.path == '/rest/v1/rpc/org_set_field':
            u2 = user_from(self.headers)
            if not u2 or u2['role'] != 'staff': return self._send(403, {'message': 'RLS: staff only'})
            b2 = self._body()
            oid = int(b2['oid'])
            if oid in ORGS: ORGS[oid]['data'][b2['fkey']] = b2['fval']
            return self._send(200, None)
        if p.path == '/rest/v1/rpc/circle_stats':
            u2 = user_from(self.headers)
            if not u2: return self._send(401, {'message': 'JWT required'})
            cid = self._body().get('cid')
            ok = u2['role'] == 'staff' or any(m['user_id'] == u2['id'] and m['circle_id'] == cid for m in CIRCLE_MEMBERS)
            if not ok: return self._send(403, {'message': 'not a member of this circle'})
            return self._send(200, circle_stats(cid))
        u = user_from(self.headers)
        if not u: return self._send(401, {'message': 'JWT required'})
        b = self._body()
        if p.path == '/rest/v1/donations':
            # staff may log gifts on behalf of any member; members only for themselves
            owner = b.get('user_id') if (u['role'] == 'staff' and b.get('user_id')) else u['id']
            d = {'id': next(seq), 'user_id': owner, **{k: b[k] for k in ('org_id','amount','gift_date','status') if k in b}, 'note': b.get('note')}
            DONATIONS.append(d); return self._send(201, [d])
        if p.path == '/rest/v1/orgs':
            if u['role'] != 'staff': return self._send(403, {'message': 'RLS: staff only'})
            ORGS[b['id']] = {'id': b['id'], 'data': b['data']}; return self._send(201, [ORGS[b['id']]])
        if p.path == '/rest/v1/org_comments':
            if u['role'] != 'staff': return self._send(403, {'message': 'RLS: staff only'})
            c = {'id': next(seq), 'org_id': b.get('org_id'), 'donor_id': b.get('donor_id'),
                 'field': b['field'], 'body': b['body'], 'mentions': b.get('mentions'),
                 'author_name': b.get('author_name'), 'resolved': False}
            COMMENTS.append(c); return self._send(201, [c])
        if p.path == '/rest/v1/org_cell_notes':
            if u['role'] != 'staff': return self._send(403, {'message': 'RLS: staff only'})
            NOTES[(b['org_id'], b['field'])] = b['body']; return self._send(201, [b])
        if p.path == '/rest/v1/circles':
            if u['role'] != 'staff': return self._send(403, {'message': 'RLS: staff only'})
            CIRCLES[b['id']] = {'id': b['id'], 'name': b['name'], 'description': b.get('description', '')}
            return self._send(201, [CIRCLES[b['id']]])
        if p.path == '/rest/v1/circle_members':
            if u['role'] != 'staff': return self._send(403, {'message': 'RLS: staff only'})
            if not any(m['circle_id'] == b['circle_id'] and m['user_id'] == b['user_id'] for m in CIRCLE_MEMBERS):
                CIRCLE_MEMBERS.append({'circle_id': b['circle_id'], 'user_id': b['user_id']})
            return self._send(201, [b])
        if p.path == '/rest/v1/donor_notes':
            if u['role'] != 'staff': return self._send(403, {'message': 'RLS: staff only'})
            DONOR_NOTES[b['user_id']] = b.get('body', ''); return self._send(201, [b])
        if p.path == '/rest/v1/invites':
            if u['role'] != 'staff': return self._send(403, {'message': 'RLS: staff only'})
            INVITES.append({'email': b.get('email'), 'note': b.get('note', '')})
            return self._send(201, [b])
        if p.path == '/rest/v1/org_workflow_events':
            if u['role'] != 'staff': return self._send(403, {'message': 'RLS: staff only'})
            ev = {'id': next(seq), 'org_id': b.get('org_id'), 'kind': b.get('kind'),
                  'author_name': b.get('author_name'), 'created_at': '2026-07-28T12:00:00Z'}
            WF_EVENTS.append(ev); return self._send(201, [ev])
        if p.path == '/rest/v1/site_visit_items':
            if u['role'] != 'staff': return self._send(403, {'message': 'RLS: staff only'})
            row = {'id': 7000 + next(seq), 'kind': b.get('kind'), 'data': b.get('data') or {}}
            SITE_VISIT_ITEMS.append(row); return self._send(201, [row])
        if p.path == '/rest/v1/org_updates':
            if u['role'] != 'staff': return self._send(403, {'message': 'RLS: staff only'})
            row = {'id': 9000 + next(seq), 'org_id': b.get('org_id'), 'quarter': b.get('quarter'),
                   'title': b.get('title', ''), 'summary': b.get('summary', ''), 'body': b.get('body', ''),
                   'link_url': b.get('link_url'), 'video_url': b.get('video_url'), 'img': b.get('img'),
                   'status': b.get('status', 'draft')}
            ORG_UPDATES.append(row); return self._send(201, [row])
        if p.path == '/rest/v1/shortlist':
            owner = b.get('user_id')
            if owner != u['id'] and u['role'] != 'staff': return self._send(403, {'message': 'RLS: own rows only'})
            SHORTLIST[:] = [s for s in SHORTLIST if not (s['user_id'] == owner and s['org_id'] == b['org_id'])]
            row = {'user_id': owner, 'org_id': b['org_id'], 'planned': b.get('planned', 0)}
            SHORTLIST.append(row); return self._send(201, [row])
        if p.path == '/rest/v1/notifications':
            owner = b.get('user_id')
            if owner != u['id'] and u['role'] != 'staff': return self._send(403, {'message': 'RLS: own rows only'})
            n = {'id': next(seq), 'user_id': owner, 'kind': b.get('kind', 'advisor'), 'body': b.get('body', ''),
                 'payload': b.get('payload'), 'handled': False, 'created_at': '2026-07-27T12:00:00Z'}
            NOTIFS.append(n); return self._send(201, [n])
        return self._send(404, {'message': 'mock: no route ' + p.path})

    def do_GET(self):
        p = urllib.parse.urlparse(self.path)
        if p.path == '/auth/v1/user':
            u = user_from(self.headers)
            return self._send(200, {'id': u['id'], 'email': u['email'], 'user_metadata': {'pw_set': u.get('pw_set', False), 'starter': u.get('starter', False)}}) if u else self._send(401, {})
        u = user_from(self.headers)
        if not u: return self._send(401, {'message': 'JWT required'})
        f = parse_filters(p.query)
        if p.path == '/rest/v1/profiles':
            rows = [dict(id=x['id'], email=x['email'], role=x['role'], full_name=x['full_name']) for x in USERS.values()]
            if u['role'] != 'staff': rows = [r for r in rows if r['id'] == u['id']]
            if 'id' in f: rows = [r for r in rows if r['id'] == f['id']]
            return self._send(200, rows)
        if p.path == '/rest/v1/orgs':
            return self._send(200, sorted(ORGS.values(), key=lambda r: r['id']))
        if p.path == '/rest/v1/donations':
            rows = [d for d in DONATIONS if d['user_id'] == u['id'] or u['role'] == 'staff']
            if 'user_id' in f: rows = [d for d in rows if d['user_id'] == f['user_id']]
            return self._send(200, sorted(rows, key=lambda d: d['gift_date']))
        if p.path == '/rest/v1/circles':
            if u['role'] == 'staff': rows = list(CIRCLES.values())
            else:
                mine = {m['circle_id'] for m in CIRCLE_MEMBERS if m['user_id'] == u['id']}
                rows = [c for c in CIRCLES.values() if c['id'] in mine]
            return self._send(200, rows)
        if p.path == '/rest/v1/circle_members':
            rows = CIRCLE_MEMBERS if u['role'] == 'staff' else [m for m in CIRCLE_MEMBERS if m['user_id'] == u['id']]
            if 'user_id' in f: rows = [m for m in rows if m['user_id'] == f['user_id']]
            out = [{**m, 'circles': CIRCLES.get(m['circle_id'])} for m in rows]
            return self._send(200, out)
        if p.path == '/rest/v1/donor_notes':
            if u['role'] != 'staff': return self._send(403, {'message': 'RLS: staff only'})
            return self._send(200, [{'user_id': k, 'body': v} for k, v in DONOR_NOTES.items()])
        if p.path == '/rest/v1/org_workflow_events':
            if u['role'] != 'staff': return self._send(403, {'message': 'RLS: staff only'})
            return self._send(200, list(reversed(WF_EVENTS)))
        if p.path == '/rest/v1/org_updates':
            return self._send(200, sorted(ORG_UPDATES, key=lambda r: r['quarter'], reverse=True))
        if p.path == '/rest/v1/site_visit_items':
            if u['role'] != 'staff': return self._send(403, {'message': 'RLS: staff only'})
            return self._send(200, sorted(SITE_VISIT_ITEMS, key=lambda r: r['id']))
        if p.path == '/rest/v1/invites':
            if u['role'] != 'staff': return self._send(403, {'message': 'RLS: staff only'})
            return self._send(200, INVITES)
        if p.path == '/rest/v1/shortlist':
            rows = SHORTLIST if u['role'] == 'staff' else [s for s in SHORTLIST if s['user_id'] == u['id']]
            if 'user_id' in f: rows = [s for s in rows if s['user_id'] == f['user_id']]
            return self._send(200, rows)
        if p.path == '/rest/v1/notifications':
            rows = NOTIFS if u['role'] == 'staff' else [n for n in NOTIFS if n['user_id'] == u['id']]
            return self._send(200, rows)
        if p.path == '/rest/v1/org_comments':
            if u['role'] != 'staff': return self._send(403, {'message': 'RLS: staff only'})
            rows = [c for c in COMMENTS if not c['resolved']] if f.get('resolved') == 'false' else COMMENTS
            return self._send(200, rows)
        if p.path == '/rest/v1/org_cell_notes':
            if u['role'] != 'staff': return self._send(403, {'message': 'RLS: staff only'})
            return self._send(200, [{'org_id': k[0], 'field': k[1], 'body': v} for k, v in NOTES.items()])
        return self._send(404, {'message': 'mock: no route ' + p.path})

    def do_PUT(self):
        p = urllib.parse.urlparse(self.path)
        u = user_from(self.headers)
        if not u: return self._send(401, {'message': 'JWT required'})
        b = self._body()
        if p.path == '/auth/v1/user':
            if b.get('password'): u['pw'] = b['password']
            if (b.get('data') or {}).get('pw_set'): u['pw_set'] = True
            if 'starter' in (b.get('data') or {}): u['starter'] = bool(b['data']['starter'])
            return self._send(200, {'id': u['id'], 'email': u['email']})
        return self._send(404, {'message': 'mock: no route'})

    def do_PATCH(self):
        p = urllib.parse.urlparse(self.path)
        u = user_from(self.headers)
        if not u: return self._send(401, {'message': 'JWT required'})
        f = parse_filters(p.query); b = self._body()
        if p.path == '/rest/v1/orgs':
            if u['role'] != 'staff': return self._send(403, {'message': 'RLS: staff only'})
            oid = int(f['id']); ORGS[oid]['data'] = b['data']; return self._send(200, [ORGS[oid]])
        if p.path == '/rest/v1/profiles':
            if u['role'] != 'staff': return self._send(403, {'message': 'RLS: staff only'})
            for usr in USERS.values():
                if usr['id'] == f.get('id'):
                    usr.update({k: v for k, v in b.items() if k in ('full_name', 'member_since', 'location', 'goal')})
                    return self._send(200, [usr])
            return self._send(404, {'message': 'not found'})
        if p.path == '/rest/v1/donations':
            did = int(f['id'])
            for d in DONATIONS:
                if d['id'] == did and (d['user_id'] == u['id'] or u['role'] == 'staff'):
                    d.update({k: v for k, v in b.items() if k != 'user_id'}); return self._send(200, [d])
            return self._send(404, {'message': 'not found'})
        if p.path == '/rest/v1/org_comments':
            cid = int(f['id'])
            for c in COMMENTS:
                if c['id'] == cid: c.update(b); return self._send(200, [c])
        if p.path == '/rest/v1/notifications':
            if u['role'] != 'staff': return self._send(403, {'message': 'RLS: staff only'})
            nid = int(f['id'])
            for n in NOTIFS:
                if n['id'] == nid: n.update(b); return self._send(200, [n])
            return self._send(404, {'message': 'not found'})
        if p.path == '/rest/v1/org_updates':
            if u['role'] != 'staff': return self._send(403, {'message': 'RLS: staff only'})
            rid = int(f['id'])
            for r in ORG_UPDATES:
                if r['id'] == rid: r.update(b); return self._send(200, [r])
            return self._send(404, {'message': 'not found'})
        if p.path == '/rest/v1/site_visit_items':
            if u['role'] != 'staff': return self._send(403, {'message': 'RLS: staff only'})
            rid = int(f['id'])
            for r in SITE_VISIT_ITEMS:
                if r['id'] == rid: r.update({k2: v2 for k2, v2 in b.items() if k2 in ('kind', 'data')}); return self._send(200, [r])
            return self._send(404, {'message': 'not found'})
        return self._send(404, {'message': 'mock: no route'})

    def do_DELETE(self):
        p = urllib.parse.urlparse(self.path)
        u = user_from(self.headers)
        if not u: return self._send(401, {'message': 'JWT required'})
        f = parse_filters(p.query)
        if p.path == '/rest/v1/donations':
            did = int(f['id'])
            before = len(DONATIONS)
            DONATIONS[:] = [d for d in DONATIONS if not (d['id'] == did and (d['user_id'] == u['id'] or u['role'] == 'staff'))]
            return self._send(204 if len(DONATIONS) < before else 404)
        if p.path == '/rest/v1/org_cell_notes':
            NOTES.pop((int(f['org_id']), f['field']), None); return self._send(204)
        if p.path == '/rest/v1/circle_members':
            if u['role'] != 'staff': return self._send(403, {'message': 'RLS: staff only'})
            CIRCLE_MEMBERS[:] = [m for m in CIRCLE_MEMBERS
                                 if not (m['circle_id'] == f.get('circle_id') and m['user_id'] == f.get('user_id'))]
            return self._send(204)
        if p.path == '/rest/v1/org_workflow_events':
            if u['role'] != 'staff': return self._send(403, {'message': 'RLS: staff only'})
            eid = int(f['id'])
            WF_EVENTS[:] = [e for e in WF_EVENTS if e['id'] != eid]
            return self._send(204)
        if p.path == '/rest/v1/org_updates':
            if u['role'] != 'staff': return self._send(403, {'message': 'RLS: staff only'})
            rid = int(f['id'])
            ORG_UPDATES[:] = [r for r in ORG_UPDATES if r['id'] != rid]
            return self._send(204)
        if p.path == '/rest/v1/site_visit_items':
            if u['role'] != 'staff': return self._send(403, {'message': 'RLS: staff only'})
            rid = int(f['id'])
            SITE_VISIT_ITEMS[:] = [r for r in SITE_VISIT_ITEMS if r['id'] != rid]
            return self._send(204)
        if p.path == '/rest/v1/shortlist':
            owner = f.get('user_id')
            if owner != u['id'] and u['role'] != 'staff': return self._send(403, {'message': 'RLS: own rows only'})
            SHORTLIST[:] = [s for s in SHORTLIST if not (s['user_id'] == owner and str(s['org_id']) == f.get('org_id'))]
            return self._send(204)
        return self._send(404, {'message': 'mock: no route'})

if __name__ == '__main__':
    print('mock supabase on http://127.0.0.1:8787 · orgs:', len(ORGS))
    HTTPServer(('127.0.0.1', 8787), H).serve_forever()
