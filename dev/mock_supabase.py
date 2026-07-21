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
    'staff@factoryforgood.com': {'id': 'u-staff', 'email': 'staff@factoryforgood.com', 'role': 'staff', 'full_name': 'Sam Staff'},
    'member@example.com': {'id': 'u-member', 'email': 'member@example.com', 'role': 'member', 'full_name': 'Mia Member'},
}
TOKENS = {}  # token -> user
DONATIONS, COMMENTS, NOTES, SHORTLIST = [], [], {}, []
seq = itertools.count(1)

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
            if not u or b.get('password') != 'pw':
                if b.get('refresh_token'):
                    for t, usr in TOKENS.items():
                        if t == b['refresh_token']: u = usr; break
                if not u: return self._send(400, {'error_description': 'Invalid login credentials'})
            tok = 'tok-' + u['id']
            TOKENS[tok] = u
            return self._send(200, {'access_token': tok, 'refresh_token': tok, 'user': {'id': u['id'], 'email': u['email']}})
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
        u = user_from(self.headers)
        if not u: return self._send(401, {'message': 'JWT required'})
        b = self._body()
        if p.path == '/rest/v1/donations':
            d = {'id': next(seq), 'user_id': u['id'], **{k: b[k] for k in ('org_id','amount','gift_date','status') if k in b}, 'note': b.get('note')}
            DONATIONS.append(d); return self._send(201, [d])
        if p.path == '/rest/v1/orgs':
            if u['role'] != 'staff': return self._send(403, {'message': 'RLS: staff only'})
            ORGS[b['id']] = {'id': b['id'], 'data': b['data']}; return self._send(201, [ORGS[b['id']]])
        if p.path == '/rest/v1/org_comments':
            if u['role'] != 'staff': return self._send(403, {'message': 'RLS: staff only'})
            c = {'id': next(seq), 'org_id': b['org_id'], 'field': b['field'], 'body': b['body'],
                 'author_name': b.get('author_name'), 'resolved': False}
            COMMENTS.append(c); return self._send(201, [c])
        if p.path == '/rest/v1/org_cell_notes':
            if u['role'] != 'staff': return self._send(403, {'message': 'RLS: staff only'})
            NOTES[(b['org_id'], b['field'])] = b['body']; return self._send(201, [b])
        return self._send(404, {'message': 'mock: no route ' + p.path})

    def do_GET(self):
        p = urllib.parse.urlparse(self.path)
        if p.path == '/auth/v1/user':
            u = user_from(self.headers)
            return self._send(200, {'id': u['id'], 'email': u['email']}) if u else self._send(401, {})
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
            return self._send(200, sorted(rows, key=lambda d: d['gift_date']))
        if p.path == '/rest/v1/org_comments':
            if u['role'] != 'staff': return self._send(403, {'message': 'RLS: staff only'})
            rows = [c for c in COMMENTS if not c['resolved']] if f.get('resolved') == 'false' else COMMENTS
            return self._send(200, rows)
        if p.path == '/rest/v1/org_cell_notes':
            if u['role'] != 'staff': return self._send(403, {'message': 'RLS: staff only'})
            return self._send(200, [{'org_id': k[0], 'field': k[1], 'body': v} for k, v in NOTES.items()])
        return self._send(404, {'message': 'mock: no route ' + p.path})

    def do_PATCH(self):
        p = urllib.parse.urlparse(self.path)
        u = user_from(self.headers)
        if not u: return self._send(401, {'message': 'JWT required'})
        f = parse_filters(p.query); b = self._body()
        if p.path == '/rest/v1/orgs':
            if u['role'] != 'staff': return self._send(403, {'message': 'RLS: staff only'})
            oid = int(f['id']); ORGS[oid]['data'] = b['data']; return self._send(200, [ORGS[oid]])
        if p.path == '/rest/v1/donations':
            did = int(f['id'])
            for d in DONATIONS:
                if d['id'] == did and d['user_id'] == u['id']:
                    d.update({k: v for k, v in b.items() if k != 'user_id'}); return self._send(200, [d])
            return self._send(404, {'message': 'not found'})
        if p.path == '/rest/v1/org_comments':
            cid = int(f['id'])
            for c in COMMENTS:
                if c['id'] == cid: c.update(b); return self._send(200, [c])
        return self._send(404, {'message': 'mock: no route'})

    def do_DELETE(self):
        p = urllib.parse.urlparse(self.path)
        u = user_from(self.headers)
        if not u: return self._send(401, {'message': 'JWT required'})
        f = parse_filters(p.query)
        if p.path == '/rest/v1/donations':
            did = int(f['id'])
            before = len(DONATIONS)
            DONATIONS[:] = [d for d in DONATIONS if not (d['id'] == did and d['user_id'] == u['id'])]
            return self._send(204 if len(DONATIONS) < before else 404)
        if p.path == '/rest/v1/org_cell_notes':
            NOTES.pop((int(f['org_id']), f['field']), None); return self._send(204)
        return self._send(404, {'message': 'mock: no route'})

if __name__ == '__main__':
    print('mock supabase on http://127.0.0.1:8787 · orgs:', len(ORGS))
    HTTPServer(('127.0.0.1', 8787), H).serve_forever()
