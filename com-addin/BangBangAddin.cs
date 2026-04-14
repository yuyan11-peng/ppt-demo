using System;
using System.Runtime.InteropServices;
using System.Windows.Forms;
using System.IO;
using System.Reflection;
using System.Drawing;
using System.Drawing.Drawing2D;

using Extensibility;
using Microsoft.Office.Core;
using PowerPoint = Microsoft.Office.Interop.PowerPoint;
using StdOleIPictureDisp = stdole.IPictureDisp;

namespace BangBangAddin
{
    [ComVisible(true)]
    [Guid("A1B2C3D4-E5F6-7890-ABCD-EF1234567890")]
    [ProgId("BangBangAddin.Addin")]
    public class BangBangAddin : IDTExtensibility2, IRibbonExtensibility, ICustomTaskPaneConsumer
    {
        private PowerPoint.Application _pptApp;
        private IRibbonUI _ribbonUI;
        private ICTPFactory _ctpFactory;
        private CustomTaskPane _taskPane;
        private BangBangTaskPaneControl.HostControl _hostControl;

        private const string VueAppUrl = "http://localhost:8989/index.html";
        private const string TaskPaneControlProgId = "BangBangTaskPaneControl.HostControl";
        private const string TaskPaneTitle = "办公帮帮";

        private static System.Collections.Generic.Dictionary<string, StdOleIPictureDisp> _imageCache
            = new System.Collections.Generic.Dictionary<string, StdOleIPictureDisp>();

        #region IDTExtensibility2

        public void OnConnection(object application, ext_ConnectMode connectMode, object addInInst, ref Array custom)
        {
            try { _pptApp = application as PowerPoint.Application; }
            catch { }
        }

        public void OnDisconnection(ext_DisconnectMode removeMode, ref Array custom)
        {
            try
            {
                CloseTaskPane();
                if (_pptApp != null) { Marshal.ReleaseComObject(_pptApp); _pptApp = null; }
            }
            catch { }
        }
        public void OnAddInsUpdate(ref Array custom) { }
        public void OnStartupComplete(ref Array custom) { }
        public void OnBeginShutdown(ref Array custom) { CloseTaskPane(); }

        #endregion

        #region ICustomTaskPaneConsumer

        /// <summary>
        /// Called by Office when the CustomTaskPane factory becomes available.
        /// This is the key interface that enables native CustomTaskPane support
        /// for COM Add-ins (not just VSTO).
        /// </summary>
        public void CTPFactoryAvailable(ICTPFactory CTPFactoryInst)
        {
            _ctpFactory = CTPFactoryInst;
        }

        #endregion

        #region IRibbonExtensibility

        public string GetCustomUI(string ribbonID)
        {
            try
            {
                string dllPath = Assembly.GetExecutingAssembly().Location;
                string xmlPath = Path.Combine(Path.GetDirectoryName(dllPath), "RibbonXml.xml");
                if (File.Exists(xmlPath)) return File.ReadAllText(xmlPath);
            }
            catch { }
            return string.Empty;
        }

        #endregion

        #region Ribbon Callbacks

        public void OnRibbonLoad(IRibbonUI ribbonUI) { _ribbonUI = ribbonUI; }

        public void OnButtonPressed(IRibbonControl control)
        {
            try
            {
                string pageParam = GetPageParam(control.Id);
                ShowTaskPane(VueAppUrl + "?action=" + pageParam);
            }
            catch (Exception ex) { MessageBox.Show("Error: " + ex.Message, "BangBang", MessageBoxButtons.OK, MessageBoxIcon.Error); }
        }

        public StdOleIPictureDisp GetButtonImage(IRibbonControl control)
        {
            string id = control.Id;
            if (_imageCache.ContainsKey(id)) return _imageCache[id];
            try
            {
                Color bgColor = GetIconColor(id);
                string iconText = GetIconText(id);
                Bitmap bmp = CreateIcon32(bgColor, iconText);
                StdOleIPictureDisp disp = PictureConverter.Convert(bmp);
                _imageCache[id] = disp;
                return disp;
            }
            catch { return null; }
        }

        /// <summary>
        /// Returns the label for each button.
        /// Uses non-breaking spaces and word-joiner characters to prevent Office from wrapping text.
        /// </summary>
        public string GetButtonLabel(IRibbonControl control)
        {
            string label = GetFullLabel(control.Id);
            // Replace all normal spaces with non-breaking spaces (U+00A0) - prevents line breaks at spaces
            label = label.Replace(' ', '\u00A0');
            // Insert word-joiner (U+2060) between each character to prevent any wrapping
            if (NeedsNoWrap(control.Id))
            {
                label = InsertWordJoiners(label);
            }
            return label;
        }

        private static bool NeedsNoWrap(string id)
        {
            return true;  // Apply to all buttons
        }

        private static string InsertWordJoiners(string text)
        {
            if (string.IsNullOrEmpty(text)) return text;
            System.Text.StringBuilder sb = new System.Text.StringBuilder();
            for (int i = 0; i < text.Length; i++)
            {
                sb.Append(text[i]);
                if (i < text.Length - 1)
                {
                    sb.Append('\u2060');  // Word Joiner - zero-width, prevents break
                }
            }
            return sb.ToString();
        }

        private static string GetFullLabel(string id)
        {
            switch (id)
            {
                case "BtnGeneratePPT":     return "一键生成PPT";
                case "BtnAIImage":         return "AI生图";
                case "BtnOptimizeContent": return "内容优化";
                case "BtnLayoutOptimize":  return "排版优化";
                case "BtnTemplates":       return "模板";
                case "BtnImages":          return "图片";
                case "BtnIcons":           return "图标";
                case "BtnSidebar":         return "侧边栏";
                default:                   return id;
            }
        }

        #endregion

        #region Icon Generation

        private static Color GetIconColor(string id)
        {
            switch (id)
            {
                case "BtnGeneratePPT":     return Color.FromArgb(66, 133, 244);
                case "BtnAIImage":         return Color.FromArgb(155, 89, 182);
                case "BtnOptimizeContent": return Color.FromArgb(46, 204, 113);
                case "BtnLayoutOptimize":  return Color.FromArgb(243, 156, 18);
                case "BtnTemplates":       return Color.FromArgb(52, 152, 219);
                case "BtnImages":          return Color.FromArgb(230, 126, 34);
                case "BtnIcons":           return Color.FromArgb(26, 188, 156);
                case "BtnSidebar":         return Color.FromArgb(127, 140, 141);
                default:                   return Color.Gray;
            }
        }

        private static string GetIconText(string id)
        {
            switch (id)
            {
                case "BtnGeneratePPT":     return "P";
                case "BtnAIImage":         return "Ai";
                case "BtnOptimizeContent": return "文";
                case "BtnLayoutOptimize":  return "排";
                case "BtnTemplates":       return "T";
                case "BtnImages":          return "图";
                case "BtnIcons":           return "S";
                case "BtnSidebar":         return "☰";
                default:                   return "?";
            }
        }

        /// <summary>
        /// Create a 32x32 icon: filled colored rounded square with white symbol
        /// </summary>
        private Bitmap CreateIcon32(Color bgColor, string symbol)
        {
            int size = 32;
            Bitmap bmp = new Bitmap(size, size);
            using (Graphics g = Graphics.FromImage(bmp))
            {
                g.SmoothingMode = SmoothingMode.AntiAlias;
                g.TextRenderingHint = System.Drawing.Text.TextRenderingHint.ClearTypeGridFit;
                g.InterpolationMode = InterpolationMode.HighQualityBicubic;
                g.Clear(Color.Transparent);

                Rectangle rect = new Rectangle(0, 0, size, size);
                using (GraphicsPath path = RoundedRect(rect, 7))
                using (SolidBrush bgBrush = new SolidBrush(bgColor))
                {
                    g.FillPath(bgBrush, path);
                }

                float fontSize = symbol.Length > 1 ? 15f : 20f;
                using (Font font = new Font("Segoe UI Semibold", fontSize, FontStyle.Bold))
                using (SolidBrush textBrush = new SolidBrush(Color.White))
                {
                    SizeF textSize = g.MeasureString(symbol, font);
                    float x = (size - textSize.Width) / 2;
                    float y = (size - textSize.Height) / 2 - 1;
                    g.DrawString(symbol, font, textBrush, x, y);
                }
            }
            return bmp;
        }

        private GraphicsPath RoundedRect(Rectangle r, int radius)
        {
            GraphicsPath path = new GraphicsPath();
            path.AddArc(r.X, r.Y, radius * 2, radius * 2, 180, 90);
            path.AddArc(r.Right - radius * 2, r.Y, radius * 2, radius * 2, 270, 90);
            path.AddArc(r.Right - radius * 2, r.Bottom - radius * 2, radius * 2, radius * 2, 0, 90);
            path.AddArc(r.X, r.Bottom - radius * 2, radius * 2, radius * 2, 90, 90);
            path.CloseAllFigures();
            return path;
        }

        #endregion

        #region PictureConverter

        internal static class PictureConverter
        {
            [DllImport("oleaut32.dll")]
            private static extern IntPtr OleCreatePictureIndirect(
                [In] ref PICTDESC pictDesc,
                [In, MarshalAs(UnmanagedType.LPStruct)] Guid iid,
                [MarshalAs(UnmanagedType.Bool)] bool fOwn,
                [Out, MarshalAs(UnmanagedType.Interface)] out object ppvObj);

            [StructLayout(LayoutKind.Sequential)]
            private struct PICTDESC
            {
                public int cbSize;
                public int picType;
                public IntPtr hBitmap;
                public IntPtr hMetafile;
                public int xExt;
                public int yExt;
            }

            private static readonly Guid IID_IPictureDisp = new Guid("{7BF80981-BF32-101A-8BBB-00AA00300CAB}");

            public static StdOleIPictureDisp Convert(Bitmap bitmap)
            {
                PICTDESC pd = default(PICTDESC);
                pd.cbSize = Marshal.SizeOf(pd);
                pd.picType = 1;
                pd.hBitmap = bitmap.GetHbitmap();
                object ppvObj;
                OleCreatePictureIndirect(ref pd, IID_IPictureDisp, true, out ppvObj);
                return (StdOleIPictureDisp)ppvObj;
            }
        }

        #endregion

        #region CustomTaskPane (Native Office API)

        /// <summary>
        /// Shows the native CustomTaskPane with the Vue app loaded inside.
        /// Uses ICustomTaskPaneConsumer + ICTPFactory - the official Office COM API
        /// for creating task panes, identical to how VSTO does it.
        /// </summary>
        private void ShowTaskPane(string url)
        {
            try
            {
                // If task pane already exists, just navigate and show
                if (_taskPane != null)
                {
                    try
                    {
                        // Try to access the ContentControl - if it throws, the pane was disposed
                        object content = _taskPane.ContentControl;
                        if (content != null)
                        {
                            _hostControl = (BangBangTaskPaneControl.HostControl)content;
                            if (_hostControl.WebBrowser != null)
                            {
                                _hostControl.WebBrowser.Navigate(url);
                            }
                            _taskPane.Visible = true;
                            return;
                        }
                    }
                    catch
                    {
                        // Pane was disposed (e.g. PPT closed it), recreate
                        _taskPane = null;
                        _hostControl = null;
                    }
                }

                // Need CTPFactory to create native task pane
                if (_ctpFactory == null)
                {
                    MessageBox.Show(
                        "CustomTaskPane 工厂不可用。\n" +
                        "请确保 TaskPaneControl.dll 已正确注册。\n\n" +
                        "尝试方案：关闭并重新打开 PowerPoint。",
                        "办公帮帮", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                    return;
                }

                // Force IE Edge rendering mode for WebBrowser control inside PPT
                SetBrowserEmulationMode();

                // Create the native CustomTaskPane using Office's ICTPFactory
                // The ProgId identifies our registered ActiveX control (HostControl)
                _taskPane = _ctpFactory.CreateCTP(TaskPaneControlProgId, TaskPaneTitle);

                // Get the hosted control and navigate to Vue app
                _hostControl = (BangBangTaskPaneControl.HostControl)_taskPane.ContentControl;
                if (_hostControl.WebBrowser != null)
                {
                    _hostControl.WebBrowser.Navigate(url);
                }

                // Dock to the right side (like Office Help pane)
                _taskPane.DockPosition = MsoCTPDockPosition.msoCTPDockPositionRight;
                _taskPane.Width = 380;

                // Show the task pane
                _taskPane.Visible = true;
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    "打开侧边栏失败: " + ex.Message + "\n\n" + ex.StackTrace,
                    "办公帮帮", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void SetBrowserEmulationMode()
        {
            try
            {
                string exeName = "POWERPNT.EXE";
                int ieVersion = 11001; // IE11 Edge mode
                string featureKey = @"SOFTWARE\Microsoft\Internet Explorer\Main\FeatureControl\FEATURE_BROWSER_EMULATION";
                using (Microsoft.Win32.RegistryKey key = Microsoft.Win32.Registry.CurrentUser.CreateSubKey(featureKey))
                {
                    if (key != null) key.SetValue(exeName, ieVersion, Microsoft.Win32.RegistryValueKind.DWord);
                }
            }
            catch { }
        }

        private void CloseTaskPane()
        {
            try
            {
                if (_taskPane != null)
                {
                    _taskPane.Visible = false;
                    _taskPane.Delete();
                }
            }
            catch { }
            _taskPane = null;
            _hostControl = null;
        }

        #endregion

        #region Helpers

        private string GetPageParam(string buttonId)
        {
            switch (buttonId)
            {
                case "BtnGeneratePPT":     return "generate";
                case "BtnAIImage":         return "aiimage";
                case "BtnOptimizeContent": return "optimize-content";
                case "BtnLayoutOptimize":  return "optimize-layout";
                case "BtnTemplates":       return "templates";
                case "BtnImages":          return "images";
                case "BtnIcons":           return "icons";
                case "BtnSidebar":         return "sidebar";
                default:                   return "home";
            }
        }

        #endregion
    }
}
