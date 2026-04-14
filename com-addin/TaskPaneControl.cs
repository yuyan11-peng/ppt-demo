using System;
using System.ComponentModel;
using System.Windows.Forms;
using System.Runtime.InteropServices;

namespace BangBangTaskPaneControl
{
    /// <summary>
    /// ActiveX container control for CustomTaskPane.
    /// This control is registered as a COM component so that Office's ICTPFactory
    /// can instantiate it as the content of a native CustomTaskPane.
    /// It hosts a WebBrowser control that displays the Vue app.
    /// </summary>
    [ComVisible(true)]
    [ClassInterface(ClassInterfaceType.None)]
    [ProgId("BangBangTaskPaneControl.HostControl")]
    [Guid("B1A2C3D4-E5F6-7890-ABCD-CONTROL00001")]
    public class HostControl : UserControl
    {
        private WebBrowser _webBrowser;

        public HostControl()
        {
            InitializeComponent();
        }

        private void InitializeComponent()
        {
            _webBrowser = new WebBrowser();
            _webBrowser.Dock = DockStyle.Fill;
            _webBrowser.ScriptErrorsSuppressed = true;
            Controls.Add(_webBrowser);
        }

        /// <summary>
        /// The WebBrowser control hosted inside this ActiveX control.
        /// The Add-in accesses this to navigate to the Vue app URL.
        /// </summary>
        [ComVisible(false)]
        public WebBrowser WebBrowser
        {
            get { return _webBrowser; }
        }

        /// <summary>
        /// Navigate the internal WebBrowser to a URL.
        /// Callable from COM via IDispatch.
        /// </summary>
        [ComVisible(true)]
        public void Navigate(string url)
        {
            if (_webBrowser != null)
            {
                _webBrowser.Navigate(url);
            }
        }
    }
}
