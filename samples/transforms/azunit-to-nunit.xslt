<?xml version="1.0"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:ms="urn:schemas-microsoft-com:xslt">

  <xsl:output method="xml" version="1.0" encoding="utf-8" omit-xml-declaration="no" indent="yes" cdata-section-elements="message stacktrace" />

  <xsl:template match="azunit">
    <test-run id="2" name="{@name}" testcasecount="{count(//test)}" time="{@duration}" total="{count(//test)}" errors="{count(//test[@result='Failed'])}" failures="0" not-run="{count(//test[@result='Ignored'])}" inconclusive="0" ignored="0" skipped="0" invalid="0" run-date="{ms:format-date(@startTime, 'yyyy-MM-dd')}" start-time="{ms:format-time(@startTime,'hh:mm:ss')}">

        <environment framework-version="2.6.0.12035" clr-version="2.0.50727.4963" os-version="Microsoft Windows NT 6.1.7600.0" platform="Win32NT" cwd="C:\Program Files\NUnit 2.6\bin" machine-name="CHARLIE-LAPTOP" user="charlie" user-domain="charlie-laptop" culture="en-GB" uiculture="en-GB" />
        
        <xsl:apply-templates />

    </test-run>
  </xsl:template>

  <xsl:template match="group">
    <xsl:element name="test-suite">
        <xsl:attribute name="type">Assembly</xsl:attribute>
        <xsl:attribute name="name"><xsl:value-of select="@name"/></xsl:attribute>
        <xsl:attribute name="fullname"><xsl:value-of select="@source"/></xsl:attribute>
        <xsl:attribute name="testcasecount"><xsl:value-of select="count(//test)"/></xsl:attribute>
        <xsl:attribute name="result"><xsl:value-of select="@result"/></xsl:attribute>
        <xsl:attribute name="time"><xsl:value-of select="@duration"/></xsl:attribute>
        <xsl:attribute name="total"><xsl:value-of select="count(//test)"/></xsl:attribute>
        <xsl:attribute name="passed"><xsl:value-of select="count(//test[@result='Passed'])"/></xsl:attribute>
        <xsl:attribute name="failed"><xsl:value-of select="count(//test[@result='Failed'])"/></xsl:attribute>
        <xsl:attribute name="inconclusive">0</xsl:attribute>
        <xsl:attribute name="skipped">0</xsl:attribute>
        <xsl:attribute name="asserts"><xsl:value-of select="count(//assertion)"/></xsl:attribute>

        <xsl:apply-templates />


    </xsl:element>

  </xsl:template>

 <xsl:template match="test[@result='Failed']">
    <test-case name="{@name}" result="{@result}" duration="{@duration}" asserts="{count(assertion)}">
      <failure>
        <message>
            <xsl:for-each select="assertion[@result='Failed']">
                <xsl:value-of select="text()" />
                <xsl:text>&#10;</xsl:text>
            </xsl:for-each>
        </message>
        <stacktrace>
            <xsl:for-each select="assertion">
                <xsl:value-of select="text()" />
                <xsl:text>&#10;</xsl:text>
            </xsl:for-each>
        </stacktrace>
      </failure>
    </test-case>
  </xsl:template>
  
   <xsl:template match="test[@result='Passed']">
    <test-case name="{@name}" result="{@result}" duration="{@duration}" asserts="{count(assertion)}" />
  </xsl:template>

  <xsl:template match="coverage">
    <!-- Bury the coverage data -->
  </xsl:template>
  
</xsl:stylesheet>
