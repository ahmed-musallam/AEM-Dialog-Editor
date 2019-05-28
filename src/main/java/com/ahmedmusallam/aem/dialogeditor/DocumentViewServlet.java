package com.ahmedmusallam.aem.dialogeditor;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.StringWriter;
import java.io.Writer;
import javax.jcr.ImportUUIDBehavior;
import javax.jcr.Session;
import javax.servlet.Servlet;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.transform.OutputKeys;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang.exception.ExceptionUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.servlets.HttpConstants;
import org.apache.sling.api.servlets.ServletResolverConstants;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.osgi.service.component.annotations.Component;
import org.w3c.dom.Document;
import org.xml.sax.SAXException;

/**
 * @link http://[host]:[port]/content/we-retail/us/en.document-view.xml
 */
@Component(
  service = Servlet.class,
  property = {
    ServletResolverConstants.SLING_SERVLET_METHODS + "=" + HttpConstants.METHOD_POST,
    ServletResolverConstants.SLING_SERVLET_METHODS + "=" + HttpConstants.METHOD_GET,
    ServletResolverConstants.SLING_SERVLET_EXTENSIONS + "=xml",
    ServletResolverConstants.SLING_SERVLET_SELECTORS + "=document-view",
    ServletResolverConstants.SLING_SERVLET_RESOURCE_TYPES + "=apps/dialogeditor"
  }
)
public class DocumentViewServlet extends SlingAllMethodsServlet {


  @Override
  protected void doGet(SlingHttpServletRequest request, SlingHttpServletResponse response)
    throws IOException {
    Session session = request.getResourceResolver().adaptTo(Session.class);
    ByteArrayOutputStream out = new ByteArrayOutputStream();
    try {
      session.exportDocumentView(request.getRequestPathInfo().getSuffix(),out,true,false);
      response.getWriter().write(prettyPrint(out.toString()));
    } catch (Exception  e) {
      response.getWriter().write(ExceptionUtils.getFullStackTrace(e));
    }
  }

  @Override
  protected void doPost(SlingHttpServletRequest request, SlingHttpServletResponse response)
    throws IOException {
    Session session = request.getResourceResolver().adaptTo(Session.class);
    ByteArrayOutputStream out = new ByteArrayOutputStream();
    try {
      InputStream in  = IOUtils.toInputStream(IOUtils.toString(request.getReader()), "utf-8");
      String path = StringUtils.substringBeforeLast(request.getRequestPathInfo().getSuffix(), "/");
      session.importXML(path,in,
        ImportUUIDBehavior.IMPORT_UUID_COLLISION_REPLACE_EXISTING);
      session.save();
      response.setStatus(SlingHttpServletResponse.SC_OK);
    } catch (Exception  e) {
      response.setStatus(SlingHttpServletResponse.SC_INTERNAL_SERVER_ERROR);
      response.getWriter().write(ExceptionUtils.getFullStackTrace(e));
    }
  }

  private Document parseXml(String xml)
    throws ParserConfigurationException, IOException, SAXException {
    DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
    DocumentBuilder db = dbf.newDocumentBuilder();
    return db.parse(IOUtils.toInputStream(xml, "utf-8"));
  }

  // https://examples.javacodegeeks.com/core-java/xml/dom/pretty-print-xml-in-java/
  private String prettyPrint(String xml)
    throws ParserConfigurationException, IOException, SAXException, TransformerException {
    Document doc = parseXml(xml);
    Transformer tf = TransformerFactory.newInstance().newTransformer();
    tf.setOutputProperty(OutputKeys.ENCODING, "UTF-8");
    tf.setOutputProperty(OutputKeys.INDENT, "yes");
    Writer out = new StringWriter();
    tf.transform(new DOMSource(doc), new StreamResult(out));
    return out.toString();
  }
}
