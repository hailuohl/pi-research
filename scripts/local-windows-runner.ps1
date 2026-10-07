param([Parameter(Mandatory=$true)][string]$SpecPath)
$ErrorActionPreference='Stop'
[Console]::Error.WriteLine('PI_LOCAL_STAGE:boot')
$env:PSModulePath=[IO.Path]::Combine($PSHOME,'Modules')
Import-Module ([IO.Path]::Combine($env:PSModulePath,'Microsoft.PowerShell.Management','Microsoft.PowerShell.Management.psd1')) -ErrorAction Stop
Import-Module ([IO.Path]::Combine($env:PSModulePath,'Microsoft.PowerShell.Utility','Microsoft.PowerShell.Utility.psd1')) -ErrorAction Stop
$spec=Get-Content -LiteralPath $SpecPath -Raw -Encoding UTF8 | ConvertFrom-Json
[Console]::Error.WriteLine('PI_LOCAL_STAGE:spec-ready')
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
using System.Text;
public static class PiNativeJob {
 [StructLayout(LayoutKind.Sequential)] public struct STARTUPINFO {public int cb; public IntPtr reserved,desktop,title;public int x,y,xs,ys,xc,yc,fill,flags;public short show,reserved2;public IntPtr reserved3,input,output,error;}
 [StructLayout(LayoutKind.Sequential)] public struct PROCESSINFO {public IntPtr process,thread;public uint pid,tid;}
 [StructLayout(LayoutKind.Sequential)] public struct SECURITY {public int size;public IntPtr descriptor;[MarshalAs(UnmanagedType.Bool)]public bool inherit;}
 [StructLayout(LayoutKind.Sequential)] public struct BASIC {public long processTime,jobTime;public uint flags;public UIntPtr min,max;public uint active;public UIntPtr affinity;public uint priority,scheduling;}
 [StructLayout(LayoutKind.Sequential)] public struct IO {public ulong a,b,c,d,e,f;}
 [StructLayout(LayoutKind.Sequential)] public struct EXTENDED {public BASIC basic;public IO io;public UIntPtr processMemory,jobMemory,peakProcess,peakJob;}
 [StructLayout(LayoutKind.Sequential)] public struct ACCOUNTING {public long a,b,c,d;public uint faults,total,active,terminated;}
 [DllImport("kernel32.dll",CharSet=CharSet.Unicode,SetLastError=true)]public static extern IntPtr CreateJobObject(IntPtr attrs,string name);
 [DllImport("kernel32.dll",SetLastError=true)]public static extern bool SetInformationJobObject(IntPtr job,int type,ref EXTENDED info,uint size);
 [DllImport("kernel32.dll",SetLastError=true)]public static extern bool QueryInformationJobObject(IntPtr job,int type,out ACCOUNTING info,uint size,IntPtr returned);
 [DllImport("kernel32.dll",SetLastError=true)]public static extern bool AssignProcessToJobObject(IntPtr job,IntPtr process);
 [DllImport("kernel32.dll",SetLastError=true)]public static extern bool TerminateJobObject(IntPtr job,uint code);
 [DllImport("kernel32.dll",SetLastError=true)]public static extern bool TerminateProcess(IntPtr process,uint code);
 [DllImport("kernel32.dll",CharSet=CharSet.Unicode,SetLastError=true)]public static extern bool CreateProcess(string app,StringBuilder command,IntPtr pa,IntPtr ta,bool inherit,uint flags,IntPtr env,string cwd,ref STARTUPINFO startup,out PROCESSINFO process);
 [DllImport("kernel32.dll",CharSet=CharSet.Unicode,SetLastError=true)]public static extern IntPtr CreateFile(string path,uint access,uint share,ref SECURITY security,uint creation,uint flags,IntPtr template);
 [DllImport("kernel32.dll")]public static extern uint ResumeThread(IntPtr thread);
 [DllImport("kernel32.dll")]public static extern uint WaitForSingleObject(IntPtr handle,uint wait);
 [DllImport("kernel32.dll")]public static extern bool GetExitCodeProcess(IntPtr handle,out uint code);
 [DllImport("kernel32.dll")]public static extern bool CloseHandle(IntPtr handle);
 public static string Quote(string value) {var s=new StringBuilder("\"");int slash=0;foreach(char c in value){if(c=='\\'){slash++;continue;}if(c=='"'){s.Append('\\',slash*2+1);s.Append(c);}else{s.Append('\\',slash);s.Append(c);}slash=0;}s.Append('\\',slash*2);return s.Append('"').ToString();}
}
'@
[Console]::Error.WriteLine('PI_LOCAL_STAGE:interop-ready')
function Write-Receipt($name,$value){$path=Join-Path $spec.control $name;$json=$value|ConvertTo-Json -Compress;[IO.File]::WriteAllText($path+'.tmp',$json,[Text.UTF8Encoding]::new($false));Move-Item -LiteralPath ($path+'.tmp') -Destination $path -Force}
$job=[IntPtr]::Zero;$pi=[PiNativeJob+PROCESSINFO]::new();$handles=@();$envp=[IntPtr]::Zero
try {
 $job=[PiNativeJob]::CreateJobObject([IntPtr]::Zero,$null);if($job -eq [IntPtr]::Zero){throw 'JOB_CREATE_FAILED'}
 $limits=[PiNativeJob+EXTENDED]::new();$limits.basic.flags=0x2000
 if(-not [PiNativeJob]::SetInformationJobObject($job,9,[ref]$limits,[Runtime.InteropServices.Marshal]::SizeOf($limits))){throw 'JOB_CONFIG_FAILED'}
 $sa=[PiNativeJob+SECURITY]::new();$sa.size=[Runtime.InteropServices.Marshal]::SizeOf($sa);$sa.inherit=$true
 $si=[PiNativeJob+STARTUPINFO]::new();$si.cb=[Runtime.InteropServices.Marshal]::SizeOf($si);$si.flags=0x100
 $si.input=[PiNativeJob]::CreateFile('NUL',[uint32]2147483648,3,[ref]$sa,3,0,[IntPtr]::Zero)
 $si.output=[PiNativeJob]::CreateFile((Join-Path $spec.control 'stdout.log'),0x40000000,3,[ref]$sa,4,0,[IntPtr]::Zero)
 $si.error=[PiNativeJob]::CreateFile((Join-Path $spec.control 'stderr.log'),0x40000000,3,[ref]$sa,4,0,[IntPtr]::Zero)
 $handles=@($si.input,$si.output,$si.error);if($handles.Where({$_ -eq [IntPtr]::new(-1)}).Count){throw 'LOG_OPEN_FAILED'}
 $entries=@($spec.env.psobject.Properties|Sort-Object Name|ForEach-Object {$_.Name+'='+[string]$_.Value});$envp=[Runtime.InteropServices.Marshal]::StringToHGlobalUni(($entries -join "`0")+"`0`0")
 $argsList=@([string]$spec.executable)+@($spec.argv);$line=($argsList|ForEach-Object {[PiNativeJob]::Quote([string]$_)}) -join ' '
 if(-not [PiNativeJob]::CreateProcess($spec.executable,[Text.StringBuilder]::new($line),[IntPtr]::Zero,[IntPtr]::Zero,$true,0x08000404,$envp,$spec.work,[ref]$si,[ref]$pi)){throw 'PROCESS_CREATE_FAILED'}
 if(-not [PiNativeJob]::AssignProcessToJobObject($job,$pi.process)){[PiNativeJob]::TerminateProcess($pi.process,1)|Out-Null;throw 'PROCESS_JOB_ASSIGN_FAILED'}
 Write-Receipt 'native-start.json' @{manifestDigest=$spec.manifestDigest;pid=$pi.pid;leaderPid=$PID}
 $cancelled=Test-Path -LiteralPath (Join-Path $spec.control 'native-cancel')
 if($cancelled){[PiNativeJob]::TerminateJobObject($job,1)|Out-Null}
 elseif([PiNativeJob]::ResumeThread($pi.thread) -eq [uint32]::MaxValue){throw 'PROCESS_RESUME_FAILED'}
 while([PiNativeJob]::WaitForSingleObject($pi.process,100) -eq 258){if(Test-Path -LiteralPath (Join-Path $spec.control 'native-cancel')){$cancelled=$true;[PiNativeJob]::TerminateJobObject($job,1)|Out-Null;break}}
 [PiNativeJob]::WaitForSingleObject($pi.process,10000)|Out-Null
 $exitCode=[uint32]0;[PiNativeJob]::GetExitCodeProcess($pi.process,[ref]$exitCode)|Out-Null
 if(-not [PiNativeJob]::TerminateJobObject($job,1)){throw 'JOB_STOP_FAILED'}
 $account=[PiNativeJob+ACCOUNTING]::new();$stopped=$false
 for($i=0;$i -lt 100;$i++){if(-not [PiNativeJob]::QueryInformationJobObject($job,1,[ref]$account,[Runtime.InteropServices.Marshal]::SizeOf($account),[IntPtr]::Zero)){throw 'JOB_INSPECT_FAILED'};if($account.active -eq 0){$stopped=$true;break};Start-Sleep -Milliseconds 50}
 if(-not $stopped){throw 'JOB_STOP_UNCONFIRMED'}
 Write-Receipt 'native-result.json' @{manifestDigest=$spec.manifestDigest;exitCode=$exitCode;cancelled=$cancelled;stopped=$true}
} finally {
 if($job -ne [IntPtr]::Zero){[PiNativeJob]::CloseHandle($job)|Out-Null}
 foreach($h in $handles+@($pi.thread,$pi.process)){if($h -ne [IntPtr]::Zero -and $h -ne [IntPtr]::new(-1)){[PiNativeJob]::CloseHandle($h)|Out-Null}}
 if($envp -ne [IntPtr]::Zero){[Runtime.InteropServices.Marshal]::FreeHGlobal($envp)}
}
