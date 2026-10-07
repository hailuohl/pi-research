"""Deterministic CUDA Driver API check; Python standard library only, no toolkit.

Run as fixed approved experiment source. CUDA_VISIBLE_DEVICES must contain the
approved full UUIDs. metrics.json is written only after actual kernel validation.
"""
import ctypes as C
import json
import os
from pathlib import Path
import re
import time

PTX = r""".version 6.0
.target sm_50
.address_size 64
.visible .entry add(.param .u64 A,.param .u64 B,.param .u64 O,.param .u32 N) {
.reg .pred p;
.reg .b32 i,n,b,t;
.reg .b64 a,bb,o,offset,pa,pb,po;
.reg .f32 x,y,z;
ld.param.u64 a,[A]; ld.param.u64 bb,[B]; ld.param.u64 o,[O]; ld.param.u32 n,[N];
mov.u32 i,%ctaid.x; mov.u32 b,%ntid.x; mov.u32 t,%tid.x; mad.lo.u32 i,i,b,t;
setp.ge.u32 p,i,n; @p bra done;
mul.wide.u32 offset,i,4; add.u64 pa,a,offset; add.u64 pb,bb,offset; add.u64 po,o,offset;
ld.global.f32 x,[pa]; ld.global.f32 y,[pb]; add.f32 z,x,y; st.global.f32 [po],z;
done: ret;
}
"""

def main():
    expected = os.environ.get("CUDA_VISIBLE_DEVICES", "").split(",")
    if not expected or any(not re.fullmatch(r"GPU-[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}", x) for x in expected):
        raise RuntimeError("Explicit full CUDA UUIDs are required")
    driver = C.WinDLL("nvcuda.dll") if os.name == "nt" else C.CDLL("libcuda.so.1")
    def api(name, args):
        fn = getattr(driver, name); fn.argtypes = args; fn.restype = C.c_int
        def checked(*values):
            code = fn(*values)
            if code: raise RuntimeError(name + " failed: " + str(code))
        return checked
    ptr = C.c_void_p; devptr = C.c_uint64
    api("cuInit", [C.c_uint])(0)
    count = C.c_int(); api("cuDeviceGetCount", [C.POINTER(C.c_int)])(C.byref(count))
    if count.value != len(expected): raise RuntimeError("CUDA visible device count mismatch")
    seen = []; started = time.perf_counter(); n = 4096; max_error = 0.0
    for ordinal in range(count.value):
        device = C.c_int(); api("cuDeviceGet", [C.POINTER(C.c_int), C.c_int])(C.byref(device), ordinal)
        uuid = (C.c_ubyte * 16)(); api("cuDeviceGetUuid", [ptr, C.c_int])(C.byref(uuid), device)
        h = bytes(uuid).hex(); identity = "GPU-" + "-".join([h[:8],h[8:12],h[12:16],h[16:20],h[20:]])
        if identity != expected[ordinal]: raise RuntimeError("CUDA device identity mismatch")
        seen.append(identity); context = ptr(); buffers = []; module = ptr()
        api("cuCtxCreate_v2", [C.POINTER(ptr), C.c_uint, C.c_int])(C.byref(context), 0, device)
        try:
            api("cuModuleLoadData", [C.POINTER(ptr), ptr])(C.byref(module), C.c_char_p(PTX.encode()))
            function = ptr(); api("cuModuleGetFunction", [C.POINTER(ptr), ptr, C.c_char_p])(C.byref(function), module, b"add")
            a = (C.c_float * n)(*(i % 97 for i in range(n))); b = (C.c_float * n)(*((i * 3) % 101 for i in range(n))); out = (C.c_float * n)()
            for _ in range(3):
                address = devptr(); api("cuMemAlloc_v2", [C.POINTER(devptr), C.c_size_t])(C.byref(address), C.sizeof(a)); buffers.append(address)
            copy_in = api("cuMemcpyHtoD_v2", [devptr, ptr, C.c_size_t])
            copy_in(buffers[0], C.byref(a), C.sizeof(a)); copy_in(buffers[1], C.byref(b), C.sizeof(b))
            size = C.c_uint(n); args = (ptr * 4)(*[C.cast(C.byref(v),ptr) for v in [*buffers,size]])
            api("cuLaunchKernel", [ptr,C.c_uint,C.c_uint,C.c_uint,C.c_uint,C.c_uint,C.c_uint,C.c_uint,ptr,ptr,ptr])(function,(n+127)//128,1,1,128,1,1,0,None,args,None)
            api("cuCtxSynchronize", [])()
            api("cuMemcpyDtoH_v2", [ptr,devptr,C.c_size_t])(C.byref(out), buffers[2], C.sizeof(out))
            error = max(abs(out[i] - (a[i]+b[i])) for i in range(n)); max_error = max(max_error,error)
            if error != 0: raise RuntimeError("GPU vector addition produced incorrect results")
        finally:
            for address in buffers: api("cuMemFree_v2", [devptr])(address)
            if module.value: api("cuModuleUnload", [ptr])(module)
            api("cuCtxDestroy_v2", [ptr])(context)
    root = Path(os.environ.get("PI_OUTPUT_DIR", os.environ.get("OUTPUT_DIR", ".")))
    root.mkdir(parents=True, exist_ok=True)
    (root/"metrics.json").write_text(json.dumps({"max_abs_error":max_error,"elements_checked":n*len(seen),"elapsed_seconds":time.perf_counter()-started}),encoding="utf-8")
    (root/"gpu-execution.json").write_text(json.dumps({"runtime":"cuda-driver","deviceIds":seen,"kernel":"vector-add","validated":True}),encoding="utf-8")
    print("CUDA kernel verified on " + ",".join(seen), flush=True)

if __name__ == "__main__": main()
