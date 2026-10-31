"""Run core/tts/tts_zh.py with edge-tts trusting this machine's TLS proxy CA (SSL_CERT_FILE), when one is set.
usage: python tools/tts_proxy.py <lib> lines.json out_dir [tts_zh args]"""
import sys, os, ssl, runpy
lib = sys.argv.pop(1)
ca = os.environ.get('SSL_CERT_FILE')
if ca and os.path.exists(ca):
    import edge_tts.communicate as c
    c._SSL_CTX = ssl.create_default_context(cafile=ca)
sys.path.insert(0, os.path.join(lib, 'core/tts'))
sys.argv[0] = os.path.join(lib, 'core/tts/tts_zh.py')
runpy.run_path(sys.argv[0], run_name='__main__')
