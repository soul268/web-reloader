#!/usr/bin/perl

use Data::Dumper;
use CGI;

use strict;

my $q = CGI->new();
print $q->header( 'text/html' );

my $text = "<!DOCTYPE HTML>\n\n";

my @params = $q->param();
if ( @params > 0 )
{
  $text .= "<ul class='param_values'>\n";
  for my $p ( @params )
  {
    my $value = $q->param( $p );
    $text .= "<li>$p=$value</li>\n";
  }
  $text .= "</ul>\n";
}

my $name = $q->param( 'name' );
$text .= "<form name='test_form' action='test_form.cgi' method='post' id='testFormId'>\n";
$text .= "<p>Name: <input type='text' name='name' value='$name'></p>\n";
$text .= "<p>Image: <input name='gopher' type='image' src='img/gopher_icon_128.png' alt='Gopher'></p>\n";
$text .= "<p><input name='Submit' type='submit' value='Submit' class='ok'></p>\n";
$text .= "<input type='hidden' name='_button_name'>\n";
$text .= "</form>\n";

print $text;

exit( 0 );
