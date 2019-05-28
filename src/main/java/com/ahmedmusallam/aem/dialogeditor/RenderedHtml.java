package com.ahmedmusallam.aem.dialogeditor;

import com.day.cq.contentsync.handler.util.RequestResponseFactory;
import com.day.cq.wcm.api.WCMMode;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import javax.annotation.PostConstruct;
import javax.inject.Inject;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.apache.commons.lang.exception.ExceptionUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.engine.SlingRequestProcessor;
import org.apache.sling.models.annotations.DefaultInjectionStrategy;
import org.apache.sling.models.annotations.Model;
import org.apache.sling.models.annotations.injectorspecific.OSGiService;
import org.apache.sling.models.annotations.injectorspecific.Self;

@Model(adaptables = SlingHttpServletRequest.class,
  defaultInjectionStrategy = DefaultInjectionStrategy.OPTIONAL)
public class RenderedHtml {

  @Inject
  String path;

  @Self
  SlingHttpServletRequest request;

  @OSGiService
  private SlingRequestProcessor requestProcessor;

  @OSGiService
  private RequestResponseFactory requestResponseFactory;

  private String output;

  @PostConstruct
  protected void init(){
    /* Setup request */
    HttpServletRequest req = requestResponseFactory.createRequest("GET", path);
    WCMMode.DISABLED.toRequest(req);

    /* Setup response */
    ByteArrayOutputStream out = new ByteArrayOutputStream();
    HttpServletResponse  resp = requestResponseFactory.createResponse(out);

    /* Process request through Sling */
    try {
      requestProcessor.processRequest(req, resp, request.getResourceResolver());
      output = out.toString();
    } catch (ServletException | IOException e) {
      output = ExceptionUtils.getFullStackTrace(e);
    }

  }

  public String getOutput() {
    return output;
  }
}
