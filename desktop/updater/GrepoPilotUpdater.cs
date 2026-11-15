using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Net;
using System.Reflection;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Script.Serialization;
using System.Windows.Forms;
using Microsoft.Win32;

[assembly: AssemblyTitle("Atualizar GrepoPilot Desktop")]
[assembly: AssemblyProduct("Atualizador GrepoPilot Desktop")]
[assembly: AssemblyFileVersion("1.0.0.0")]

public sealed class ReleaseData
{
    public string tag_name { get; set; }
    public bool draft { get; set; }
    public bool prerelease { get; set; }
    public Asset[] assets { get; set; }
}

public sealed class Asset
{
    public string name { get; set; }
    public string state { get; set; }
    public long size { get; set; }
    public string digest { get; set; }
    public string browser_download_url { get; set; }
    internal Version Version { get; set; }
}

internal static class GrepoPilotUpdater
{
    private const string AppName = "GrepoPilot Desktop";
    private const string Repository = "Jugo26/automatic-enigma";
    private const string InstallKey = @"Software\cf934c50-ffd2-5588-9015-f1d5bb089850";
    internal const string LatestRelease = "https://api.github.com/repos/" + Repository + "/releases/latest";

    [STAThread]
    private static void Main()
    {
        ServicePointManager.SecurityProtocol |= SecurityProtocolType.Tls12;
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        bool first;
        using (var mutex = new Mutex(true, @"Local\GrepoPilotDesktopUpdater", out first))
        {
            if (!first)
            {
                MessageBox.Show("O atualizador já está aberto.", "Atualizar GrepoPilot Desktop");
                return;
            }
            Application.Run(new UpdaterWindow());
        }
    }

    internal static Asset ParseRelease(string json)
    {
        var release = new JavaScriptSerializer().Deserialize<ReleaseData>(json);
        if (release == null || release.draft || release.prerelease ||
            !Regex.IsMatch(release.tag_name ?? "", @"\Av[0-9]+\.[0-9]+\.[0-9]+\z"))
            throw new InvalidOperationException("O GitHub não informou uma versão estável compatível.");
        var version = Version.Parse(release.tag_name.Substring(1));
        var name = AppName.Replace(' ', '-') + "-" + version + "-x64.exe";
        var expectedUrl = "https://github.com/" + Repository + "/releases/download/" + release.tag_name + "/" + name;
        var asset = (release.assets ?? new Asset[0]).FirstOrDefault(a => a != null &&
            a.name == name && a.state == "uploaded" && a.browser_download_url == expectedUrl);
        if (asset == null || asset.size <= 0 || !Regex.IsMatch(asset.digest ?? "", @"\Asha256:[0-9a-fA-F]{64}\z"))
            throw new InvalidOperationException("A publicação ainda não tem um instalador com verificação SHA-256.");
        asset.Version = version;
        return asset;
    }

    internal static Version ReadVersion(string exe)
    {
        if (!File.Exists(exe)) return null;
        var info = FileVersionInfo.GetVersionInfo(exe);
        Version version;
        if (info.ProductName != AppName || !Version.TryParse(info.ProductVersion, out version) || version.Build < 0)
            return null;
        return new Version(version.Major, version.Minor, version.Build);
    }

    internal static string FindInstallation()
    {
        foreach (var hive in new[] { Registry.CurrentUser, Registry.LocalMachine })
        {
            using (var record = hive.OpenSubKey(InstallKey))
            {
                var directory = record == null ? null : record.GetValue("InstallLocation") as string;
                if (string.IsNullOrWhiteSpace(directory) || !Path.IsPathRooted(directory)) continue;
                var exe = Path.Combine(directory, AppName + ".exe");
                if (ReadVersion(exe) != null) return exe;
            }
        }
        var fallback = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "Programs", AppName, AppName + ".exe");
        if (ReadVersion(fallback) != null) return fallback;
        throw new FileNotFoundException("O GrepoPilot Desktop não foi encontrado no Windows.");
    }

    internal static WebClient CreateClient()
    {
        var client = new WebClient { Encoding = Encoding.UTF8 };
        client.Headers[HttpRequestHeader.UserAgent] = "GrepoPilotDesktopUpdater/1.0";
        return client;
    }

    internal static bool Matches(string file, Asset asset)
    {
        if (!File.Exists(file) || new FileInfo(file).Length != asset.size) return false;
        using (var stream = File.OpenRead(file))
        using (var sha = SHA256.Create())
        {
            var digest = "sha256:" + BitConverter.ToString(sha.ComputeHash(stream)).Replace("-", "");
            return string.Equals(digest, asset.digest, StringComparison.OrdinalIgnoreCase);
        }
    }

    private static bool Running(string processName)
    {
        var processes = Process.GetProcessesByName(processName);
        foreach (var process in processes) process.Dispose();
        return processes.Length > 0;
    }

    internal static async Task<string> Update(Action<string> status, Action<int> progress,
        Action installing, CancellationToken cancellation)
    {
        var app = FindInstallation();
        var current = ReadVersion(app);
        using (var client = CreateClient())
        using (cancellation.Register(client.CancelAsync))
        {
            status("Consultando a versão oficial no GitHub...");
            client.Headers[HttpRequestHeader.Accept] = "application/vnd.github+json";
            var release = ParseRelease(await client.DownloadStringTaskAsync(new Uri(LatestRelease)));
            if (current >= release.Version) return "O GrepoPilot Desktop já está atualizado (" + current + ").";

            var folder = Path.Combine(Path.GetTempPath(), "GrepoPilot-" + Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(folder);
            var installer = Path.Combine(folder, release.name);
            try
            {
                var cached = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                    "grepopilot-desktop-updater", "pending", release.name);
                status("Preparando o instalador " + release.Version + "...");
                if (await Task.Run(() => Matches(cached, release), cancellation))
                {
                    File.Copy(cached, installer);
                }
                else
                {
                    status("Baixando a versão " + release.Version + "...");
                    client.Headers.Remove(HttpRequestHeader.Accept);
                    client.DownloadProgressChanged += (sender, e) => progress(Math.Max(0, Math.Min(e.ProgressPercentage, 100)));
                    await client.DownloadFileTaskAsync(new Uri(release.browser_download_url), installer);
                }
                var installerName = Path.GetFileNameWithoutExtension(release.name);
                while (Running(AppName) || Running(installerName))
                {
                    status("Feche o GrepoPilot Desktop. A atualização continua assim que ele fechar.");
                    await Task.Delay(1000, cancellation);
                }
                status("Verificando o instalador...");
                if (!await Task.Run(() => Matches(installer, release), cancellation))
                    throw new InvalidOperationException("O arquivo recebido não corresponde ao publicado no GitHub.");
                if (Running(AppName))
                    throw new InvalidOperationException("O GrepoPilot Desktop foi reaberto. Feche o aplicativo e execute o atualizador novamente.");
                cancellation.ThrowIfCancellationRequested();
                current = ReadVersion(app);
                if (current >= release.Version)
                    return "O GrepoPilot Desktop já está atualizado (" + current + ").";
                installing();
                status("Instalando a versão " + release.Version + " na pasta atual...");
                // O NSIS lê /D até o fim da linha, inclusive os espaços do caminho.
                var start = new ProcessStartInfo(installer, "--updated /S /D=" + Path.GetDirectoryName(app))
                    { UseShellExecute = true, WorkingDirectory = folder };
                using (var process = Process.Start(start))
                {
                    if (process == null) throw new InvalidOperationException("O instalador não abriu.");
                    await Task.Run(() => process.WaitForExit());
                    if (process.ExitCode != 0)
                        throw new InvalidOperationException("O instalador foi interrompido ou retornou um erro.");
                }
                var installed = ReadVersion(app);
                if (installed == null || installed < release.Version)
                    throw new InvalidOperationException("A nova versão ainda não apareceu na pasta de instalação.");
                return "Atualizado para " + installed + ". Você já pode abrir o GrepoPilot Desktop.";
            }
            finally
            {
                try { File.Delete(installer); Directory.Delete(folder); }
                catch (IOException) { }
                catch (UnauthorizedAccessException) { }
            }
        }
    }
}

internal sealed class UpdaterWindow : Form
{
    private readonly Label status = new Label();
    private readonly ProgressBar progress = new ProgressBar();
    private readonly CancellationTokenSource cancellation = new CancellationTokenSource();
    private bool installing;
    private bool finished;

    internal UpdaterWindow()
    {
        Text = "Atualizar GrepoPilot Desktop";
        StartPosition = FormStartPosition.CenterScreen;
        ClientSize = new Size(436, 155);
        FormBorderStyle = FormBorderStyle.FixedDialog;
        MaximizeBox = false;
        status.SetBounds(16, 18, 404, 52);
        progress.SetBounds(16, 74, 404, 18);
        var close = new Button { Text = "Fechar" };
        close.SetBounds(332, 111, 88, 28);
        close.Click += (sender, e) => Close();
        Controls.AddRange(new Control[] { status, progress, close });
        FormClosing += (sender, e) => {
            if (finished) return;
            e.Cancel = true;
            if (!installing) cancellation.Cancel();
        };
        Shown += async (sender, e) => {
            try
            {
                status.Text = await GrepoPilotUpdater.Update(
                    text => { status.Text = text; progress.Style = ProgressBarStyle.Marquee; },
                    percent => { progress.Style = ProgressBarStyle.Continuous; progress.Value = percent; },
                    () => { installing = true; close.Enabled = false; }, cancellation.Token);
            }
            catch (Exception error)
            {
                if (!cancellation.IsCancellationRequested) status.Text = error.Message;
            }
            finally
            {
                installing = false;
                finished = true;
                progress.Visible = false;
                close.Enabled = true;
                if (cancellation.IsCancellationRequested) Close();
            }
        };
    }
}
