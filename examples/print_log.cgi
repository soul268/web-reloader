#!/usr/bin/perl

use 5.014;
use strict;

use autodie qw(:all);
use Carp;
use CGI;
use Data::Dumper;
use Tie::Scalar::Timestamp;

tie my $timestamp, 'Tie::Scalar::Timestamp';

my $q = CGI->new();
print $q->header('text/html');

my $log_fname = '/tmp/print_log.log';
open my $log, '>>', "$log_fname";
print $log create_msg( $q );
close $log;

print "OK\n\n";
exit(0);

sub create_msg {
  my $q = shift;

  my $text;
  my @params = $q->param();
  if ( @params > 0 )
  {
    # $text .= "+++++++++++++++++++++++++++++++++++++++++++++++++++++++ $timestamp\n";
    for my $p ( @params )
    {
      my @values = $q->param( $p );
      for my $v( @values) {
        $text .= "$timestamp: $v\n";
      }
    }
    # $text .= "------------------------------------------------------- $timestamp\n";
  }

  return $text;
}

